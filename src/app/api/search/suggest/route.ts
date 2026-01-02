import type { NextRequest } from 'next/server'

import { db } from '@/db'
import { invalid_lexicons, valid_lexicons } from '@/db/schema'
import { ValidationError, parseIntegerParam } from '@/util/params'
import { sql } from 'drizzle-orm'
import { union } from 'drizzle-orm/pg-core'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function parseQuery(searchParams: URLSearchParams): string {
  const query = (searchParams.get('query') ?? '').trim()

  // For typeahead, we require at least 1 char
  if (!query) {
    throw new ValidationError('MISSING_QUERY', 'query parameter is required')
  }

  return query
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const type = (searchParams.get('type') ?? 'nsid').trim()
    if (type !== 'nsid') {
      throw new ValidationError('INVALID_TYPE', "type must be 'nsid'")
    }

    const query = parseQuery(searchParams)
    const limit = parseIntegerParam(searchParams, 'limit', DEFAULT_LIMIT, {
      min: 1,
      max: MAX_LIMIT,
    })

    // Dedupe across both valid + invalid tables.
    const combinedNsids = union(
      db.select({ nsid: valid_lexicons.nsid }).from(valid_lexicons),
      db.select({ nsid: invalid_lexicons.nsid }).from(invalid_lexicons),
    ).as('combined_nsids')

    const rows = await db
      .selectDistinct({ value: combinedNsids.nsid })
      .from(combinedNsids)
      .where(sql`${combinedNsids.nsid} ilike ${'%' + query + '%'}`)
      .orderBy(combinedNsids.nsid)
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
