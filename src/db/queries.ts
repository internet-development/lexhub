import { db } from '@/db'
import { valid_lexicons } from '@/db/schema'
import { desc, eq, like, sql } from 'drizzle-orm'
import type { LexiconDoc } from '@atproto/lexicon'

export type { LexiconDoc }

/**
 * Fetches the latest lexicon document by NSID
 * Returns null if no lexicon exists for this NSID
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
 * Checks if any valid lexicons exist under a given prefix
 */
export async function hasLexiconsUnderPrefix(prefix: string): Promise<boolean> {
  const result = await db
    .select({ nsid: valid_lexicons.nsid })
    .from(valid_lexicons)
    .where(like(valid_lexicons.nsid, `${prefix}.%`))
    .limit(1)

  return result.length > 0
}

/**
 * Gets direct children of a namespace prefix (next segment only, deduplicated)
 * Returns segment names and whether they are lexicons or just namespace prefixes
 *
 * @example
 * getDirectChildren('app.bsky') → [
 *   { segment: 'actor', isLexicon: false },
 *   { segment: 'feed', isLexicon: false },
 *   ...
 * ]
 */
export async function getDirectChildren(
  prefix: string,
): Promise<Array<{ segment: string; isLexicon: boolean }>> {
  const prefixLength = prefix.split('.').length

  // Query to extract the next segment after the prefix and check if it's a full NSID
  const result: Array<{ segment: string; is_lexicon: boolean }> =
    await db.execute(
      sql`
      SELECT DISTINCT
        SPLIT_PART(nsid, '.', ${prefixLength + 1}) as segment,
        -- Check if this exact path (prefix + segment) is a lexicon
        EXISTS (
          SELECT 1 FROM valid_lexicons v2
          WHERE v2.nsid = ${prefix} || '.' || SPLIT_PART(valid_lexicons.nsid, '.', ${prefixLength + 1})
        ) as is_lexicon
      FROM valid_lexicons
      WHERE nsid LIKE ${prefix + '.%'}
        AND SPLIT_PART(nsid, '.', ${prefixLength + 1}) != ''
      ORDER BY segment
    `,
    )

  return result.map((row) => ({
    segment: row.segment,
    isLexicon: row.is_lexicon,
  }))
}

export interface TreeNode {
  segment: string
  isLexicon: boolean
  fullPath: string
}

export interface TreeData {
  parent: string | null
  subject: string
  siblings: TreeNode[]
  children: TreeNode[]
}

/**
 * Gets tree data for sidebar navigation
 * Returns parent, siblings (excluding subject), and children
 *
 * For namespace subjects: children are direct namespace/lexicon children
 * For lexicon subjects: children are schema definition names from the lexicon
 */
export async function getTreeData(
  subjectPath: string,
  lexiconDoc: LexiconDoc | null,
): Promise<TreeData> {
  const segments = subjectPath.split('.')
  const subject = segments[segments.length - 1]
  const parent = segments.length > 2 ? segments.slice(0, -1).join('.') : null

  // Get siblings (other children of parent, excluding subject)
  let siblings: TreeNode[] = []
  if (parent) {
    const parentChildren = await getDirectChildren(parent)
    siblings = parentChildren
      .filter((child) => child.segment !== subject)
      .map((child) => ({
        segment: child.segment,
        isLexicon: child.isLexicon,
        fullPath: `${parent}.${child.segment}`,
      }))
  }

  // Get children
  let children: TreeNode[] = []

  if (lexiconDoc) {
    // For lexicons, children are schema definition names
    const defs = lexiconDoc.defs || {}
    children = Object.keys(defs)
      .sort()
      .map((defName) => ({
        segment: defName,
        isLexicon: false, // Schema defs aren't lexicons
        fullPath: `${subjectPath}#${defName}`, // Use hash for def anchors
      }))
  } else {
    // For namespaces, children are direct children
    const directChildren = await getDirectChildren(subjectPath)
    children = directChildren.map((child) => ({
      segment: child.segment,
      isLexicon: child.isLexicon,
      fullPath: `${subjectPath}.${child.segment}`,
    }))
  }

  return {
    parent,
    subject,
    siblings,
    children,
  }
}

/**
 * Gets namespace data for rendering the namespace page
 * Returns child namespaces with their lexicon counts
 */
export async function getNamespaceData(prefix: string): Promise<{
  children: Array<{
    segment: string
    fullPath: string
    isLexicon: boolean
    lexiconCount: number
    description: string | null
  }>
}> {
  const prefixLength = prefix.split('.').length

  // Get children with counts
  const result: Array<{
    segment: string
    is_lexicon: boolean
    lexicon_count: number
    description: string | null
  }> = await db.execute(
    sql`
      WITH child_segments AS (
        SELECT DISTINCT
          SPLIT_PART(nsid, '.', ${prefixLength + 1}) as segment
        FROM valid_lexicons
        WHERE nsid LIKE ${prefix + '.%'}
          AND SPLIT_PART(nsid, '.', ${prefixLength + 1}) != ''
      )
      SELECT
        cs.segment,
        -- Check if this exact path is a lexicon
        EXISTS (
          SELECT 1 FROM valid_lexicons
          WHERE nsid = ${prefix} || '.' || cs.segment
        ) as is_lexicon,
        -- Count all lexicons under this path
        (
          SELECT COUNT(DISTINCT nsid)
          FROM valid_lexicons
          WHERE nsid LIKE ${prefix} || '.' || cs.segment || '.%'
             OR nsid = ${prefix} || '.' || cs.segment
        )::int as lexicon_count,
        -- Get description if it's a lexicon
        (
          SELECT data->>'description'
          FROM valid_lexicons
          WHERE nsid = ${prefix} || '.' || cs.segment
          ORDER BY ingested_at DESC
          LIMIT 1
        ) as description
      FROM child_segments cs
      ORDER BY cs.segment
    `,
  )

  return {
    children: result.map((row) => ({
      segment: row.segment,
      fullPath: `${prefix}.${row.segment}`,
      isLexicon: row.is_lexicon,
      lexiconCount: row.lexicon_count,
      description: row.description,
    })),
  }
}
