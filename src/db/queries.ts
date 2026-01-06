import { db } from '@/db'
import { valid_lexicons } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import type { LexiconDoc } from '@atproto/lexicon'

/**
 * Fetches the latest lexicon document by NSID
 */
export async function getLexiconByNsid(
  nsid: string,
): Promise<LexiconDoc | null> {
  const result = await db
    .select({ data: valid_lexicons.data })
    .from(valid_lexicons)
    .where(eq(valid_lexicons.nsid, nsid))
    .orderBy(desc(valid_lexicons.ingestedAt))
    .limit(1)

  if (result.length === 0) return null
  return result[0].data as LexiconDoc
}

/**
 * Gets direct children segments of a namespace prefix
 */
export async function getDirectChildren(
  prefix: string,
): Promise<Array<{ segment: string; isLexicon: boolean }>> {
  const prefixDepth = prefix.split('.').length

  const result: Array<{ segment: string; is_lexicon: boolean }> =
    await db.execute(sql`
      SELECT DISTINCT
        SPLIT_PART(nsid, '.', ${prefixDepth + 1}) as segment,
        EXISTS (
          SELECT 1 FROM valid_lexicons v2
          WHERE v2.nsid = ${prefix} || '.' || SPLIT_PART(valid_lexicons.nsid, '.', ${prefixDepth + 1})
        ) as is_lexicon
      FROM valid_lexicons
      WHERE nsid LIKE ${prefix + '.%'}
        AND SPLIT_PART(nsid, '.', ${prefixDepth + 1}) != ''
      ORDER BY segment
    `)

  return result.map((row) => ({
    segment: row.segment,
    isLexicon: row.is_lexicon,
  }))
}

export interface NamespaceChild {
  segment: string
  fullPath: string
  isLexicon: boolean
  lexiconCount: number
  description: string | null
}

/**
 * Gets children of a namespace prefix for rendering the namespace page
 */
export async function getNamespaceChildren(
  prefix: string,
): Promise<NamespaceChild[]> {
  const prefixDepth = prefix.split('.').length

  const result: Array<{
    segment: string
    is_lexicon: boolean
    lexicon_count: number
    description: string | null
  }> = await db.execute(sql`
    WITH child_segments AS (
      SELECT DISTINCT SPLIT_PART(nsid, '.', ${prefixDepth + 1}) as segment
      FROM valid_lexicons
      WHERE nsid LIKE ${prefix + '.%'}
        AND SPLIT_PART(nsid, '.', ${prefixDepth + 1}) != ''
    )
    SELECT
      cs.segment,
      EXISTS (
        SELECT 1 FROM valid_lexicons WHERE nsid = ${prefix} || '.' || cs.segment
      ) as is_lexicon,
      (
        SELECT COUNT(DISTINCT nsid)::int FROM valid_lexicons
        WHERE nsid LIKE ${prefix} || '.' || cs.segment || '.%'
           OR nsid = ${prefix} || '.' || cs.segment
      ) as lexicon_count,
      (
        SELECT data->>'description' FROM valid_lexicons
        WHERE nsid = ${prefix} || '.' || cs.segment
        ORDER BY ingested_at DESC LIMIT 1
      ) as description
    FROM child_segments cs
    ORDER BY cs.segment
  `)

  return result.map((row) => ({
    segment: row.segment,
    fullPath: `${prefix}.${row.segment}`,
    isLexicon: row.is_lexicon,
    lexiconCount: row.lexicon_count,
    description: row.description,
  }))
}

export interface RootNamespace {
  prefix: string
  lexiconCount: number
  latestUpdate: Date
}

const FEATURED_NAMESPACES = [
  'app.bsky',
  'chat.bsky',
  'com.atproto',
  'tools.ozone',
  'xyz.statusphere',
  'org.robocracy',
  'com.atprofile',
  'uk.skyblur',
]

/**
 * Gets root-level namespaces (2-segment prefixes like "app.bsky")
 * with lexicon counts and latest update times.
 */
export async function getRootNamespaces(options?: {
  sortBy?: 'featured' | 'lexiconCount' | 'recentlyUpdated'
  limit?: number
}): Promise<RootNamespace[]> {
  const { sortBy = 'featured', limit = 20 } = options ?? {}

  const orderClause =
    sortBy === 'recentlyUpdated'
      ? sql`latest_update DESC`
      : sql`lexicon_count DESC`

  const result: Array<{
    prefix: string
    lexicon_count: number
    latest_update: Date
  }> = await db.execute(sql`
    SELECT 
      SPLIT_PART(nsid, '.', 1) || '.' || SPLIT_PART(nsid, '.', 2) as prefix,
      COUNT(DISTINCT nsid)::int as lexicon_count,
      MAX(ingested_at) as latest_update
    FROM valid_lexicons
    GROUP BY prefix
    ORDER BY ${orderClause}
    LIMIT ${limit}
  `)

  let namespaces = result.map((row) => ({
    prefix: row.prefix,
    lexiconCount: row.lexicon_count,
    latestUpdate: row.latest_update,
  }))

  // For featured, filter to known namespaces and preserve order
  if (sortBy === 'featured') {
    const namespaceMap = new Map(namespaces.map((n) => [n.prefix, n]))
    namespaces = FEATURED_NAMESPACES.map((prefix) =>
      namespaceMap.get(prefix),
    ).filter((n): n is RootNamespace => n !== undefined)
  }

  return namespaces
}
