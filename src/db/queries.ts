import { db } from '@/db'
import { valid_lexicons, invalid_lexicons } from '@/db/schema'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { union } from 'drizzle-orm/pg-core'
import { unstable_cache } from 'next/cache'
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
 * Fetches a specific lexicon version by NSID and CID
 */
export async function getLexiconByCid(
  nsid: string,
  cid: string,
): Promise<LexiconDoc | null> {
  const result = await db
    .select({ data: valid_lexicons.data })
    .from(valid_lexicons)
    .where(and(eq(valid_lexicons.nsid, nsid), eq(valid_lexicons.cid, cid)))
    .limit(1)

  if (result.length === 0) return null
  return result[0].data as LexiconDoc
}

export interface LexiconVersion {
  cid: string
  repoDid: string
  repoRev: string
  ingestedAt: Date
}

/**
 * Fetches all versions of a lexicon by NSID, sorted by most recent first
 */
export async function getVersionsForNsid(
  nsid: string,
): Promise<LexiconVersion[]> {
  const result = await db
    .select({
      cid: valid_lexicons.cid,
      repoDid: valid_lexicons.repoDid,
      repoRev: valid_lexicons.repoRev,
      ingestedAt: valid_lexicons.ingestedAt,
    })
    .from(valid_lexicons)
    .where(eq(valid_lexicons.nsid, nsid))
    .orderBy(desc(valid_lexicons.ingestedAt))

  return result
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
      ORDER BY is_lexicon ASC, segment ASC
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
    ORDER BY is_lexicon ASC, cs.segment ASC
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

export interface RecentActivity {
  valid: number
  invalid: number
  total: number
}

export interface Stats {
  totalLexicons: number
  validLexicons: number
  invalidLexicons: number
  uniqueNsids: number
  uniqueRepositories: number
  recentActivity: {
    last24h: RecentActivity
    last7d: RecentActivity
  }
}

/**
 * Gets comprehensive stats for the homepage
 */
export async function getStats(): Promise<Stats> {
  const combinedNsids = union(
    db.select({ nsid: valid_lexicons.nsid }).from(valid_lexicons),
    db.select({ nsid: invalid_lexicons.nsid }).from(invalid_lexicons),
  ).as('combined_nsids')

  const combinedRepos = union(
    db.select({ repoDid: valid_lexicons.repoDid }).from(valid_lexicons),
    db.select({ repoDid: invalid_lexicons.repoDid }).from(invalid_lexicons),
  ).as('combined_repos')

  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    validCount,
    invalidCount,
    nsidResult,
    repoResult,
    valid24h,
    invalid24h,
    valid7d,
    invalid7d,
  ] = await Promise.all([
    db.$count(valid_lexicons),
    db.$count(invalid_lexicons),
    db.select({ count: sql<number>`count(*)`.as('count') }).from(combinedNsids),
    db.select({ count: sql<number>`count(*)`.as('count') }).from(combinedRepos),
    db.$count(valid_lexicons, gte(valid_lexicons.ingestedAt, last24h)),
    db.$count(invalid_lexicons, gte(invalid_lexicons.ingestedAt, last24h)),
    db.$count(valid_lexicons, gte(valid_lexicons.ingestedAt, last7d)),
    db.$count(invalid_lexicons, gte(invalid_lexicons.ingestedAt, last7d)),
  ])

  return {
    totalLexicons: validCount + invalidCount,
    validLexicons: validCount,
    invalidLexicons: invalidCount,
    uniqueNsids: nsidResult[0]?.count ?? 0,
    uniqueRepositories: repoResult[0]?.count ?? 0,
    recentActivity: {
      last24h: {
        valid: valid24h,
        invalid: invalid24h,
        total: valid24h + invalid24h,
      },
      last7d: {
        valid: valid7d,
        invalid: invalid7d,
        total: valid7d + invalid7d,
      },
    },
  }
}

/**
 * Cached version of getRootNamespaces for use in pages with force-dynamic
 */
export const getCachedRootNamespaces = unstable_cache(
  async (
    sortBy: 'featured' | 'lexiconCount' | 'recentlyUpdated' = 'featured',
    limit: number = 20,
  ) => getRootNamespaces({ sortBy, limit }),
  ['root-namespaces'],
  { revalidate: 60 },
)

/**
 * Cached version of getStats for use in pages with force-dynamic
 */
export const getCachedStats = unstable_cache(getStats, ['stats'], {
  revalidate: 60,
})
