import type { NextRequest } from 'next/server'

import { db } from '@/db'
import { invalid_lexicons, valid_lexicons } from '@/db/schema'
import { ValidationError, parseIntegerParam } from '@/util/params'
import { sql, type SQL } from 'drizzle-orm'
import { union } from 'drizzle-orm/pg-core'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function parseQuery(searchParams: URLSearchParams): string[] {
  const query = (searchParams.get('query') ?? '').trim()

  // For typeahead, we require at least 1 char
  if (!query) {
    throw new ValidationError('MISSING_QUERY', 'query parameter is required')
  }

  // Split on whitespace to support multi-term searches
  return query.split(/\s+/).filter((term) => term.length > 0)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const type = (searchParams.get('type') ?? 'nsid').trim()
    if (type !== 'nsid') {
      throw new ValidationError('INVALID_TYPE', "type must be 'nsid'")
    }

    const terms = parseQuery(searchParams)
    const limit = parseIntegerParam(searchParams, 'limit', DEFAULT_LIMIT, {
      min: 1,
      max: MAX_LIMIT,
    })

    // Dedupe across both valid + invalid tables.
    const combinedNsids = union(
      db.select({ nsid: valid_lexicons.nsid }).from(valid_lexicons),
      db.select({ nsid: invalid_lexicons.nsid }).from(invalid_lexicons),
    ).as('combined_nsids')

    // Build WHERE clause: all terms must match (via ILIKE or fuzzy)
    const whereConditions: SQL[] = terms.map(
      (term) =>
        sql`(${combinedNsids.nsid} ilike ${'%' + term + '%'} OR word_similarity(${term}, ${combinedNsids.nsid}) >= 0.3)`,
    )
    const whereClause = sql.join(whereConditions, sql` AND `)

    // Build relevance score: sum of per-term scores
    // Lower score = better match
    // Per term: 0 = prefix, 1 = segment match, 2 = contains, 3 = fuzzy only
    const scoreExpressions: SQL[] = terms.map(
      (term) =>
        sql`CASE
          WHEN ${combinedNsids.nsid} ilike ${term + '%'} THEN 0
          WHEN ${combinedNsids.nsid} ilike ${'%.' + term} THEN 1
          WHEN ${combinedNsids.nsid} ilike ${'%.' + term + '.%'} THEN 1
          WHEN ${combinedNsids.nsid} ilike ${'%' + term + '%'} THEN 2
          ELSE 3
        END`,
    )
    const totalScore =
      scoreExpressions.length === 1
        ? scoreExpressions[0]
        : sql`(${sql.join(scoreExpressions, sql` + `)})`

    const rows = await db
      .select({ value: combinedNsids.nsid })
      .from(combinedNsids)
      .where(whereClause)
      .orderBy(totalScore, sql`length(${combinedNsids.nsid})`, combinedNsids.nsid)
      .limit(limit)

    const data = rows.map((row) => row.value)

    return Response.json({ data })
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.toResponse()
    }

    console.error('Error fetching typeahead suggestions:', error)
    return Response.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch suggestions',
        },
      },
      { status: 500 },
    )
  }
}
