import { db } from '@/db'
import { valid_lexicons } from '@/db/schema'
import { desc, eq, like, sql } from 'drizzle-orm'
import type { LexiconDoc } from '@atproto/lexicon'

export type { LexiconDoc }

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
 * Gets direct children segments of a namespace prefix
 */
async function getDirectChildren(
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

export interface TreeNode {
  segment: string
  isLexicon: boolean
  isSchemaDefinition: boolean
  fullPath: string
}

export interface TreeData {
  parent: string | null
  subject: string
  siblings: TreeNode[]
  children: TreeNode[]
}

/**
 * Gets tree data for sidebar navigation.
 * For lexicons: children are schema definition names.
 * For namespaces: children are direct namespace/lexicon children.
 */
export async function getTreeData(
  subjectPath: string,
  lexiconDoc: LexiconDoc | null,
): Promise<TreeData> {
  const segments = subjectPath.split('.')
  const subject = segments[segments.length - 1]
  const parent = segments.length > 2 ? segments.slice(0, -1).join('.') : null

  // For lexicons, children come from schema defs (no DB query needed)
  if (lexiconDoc) {
    const defs = lexiconDoc.defs ?? {}
    const children: TreeNode[] = Object.keys(defs).map((defName) => ({
      segment: defName,
      isLexicon: false,
      isSchemaDefinition: true,
      fullPath: `${subjectPath}#${defName}`,
    }))

    // Only need to fetch siblings if we have a parent
    let siblings: TreeNode[] = []
    if (parent) {
      const parentChildren = await getDirectChildren(parent)
      siblings = parentChildren
        .filter((child) => child.segment !== subject)
        .map((child) => ({
          ...child,
          isSchemaDefinition: false,
          fullPath: `${parent}.${child.segment}`,
        }))
    }

    return { parent, subject, siblings, children }
  }

  // For namespaces, fetch siblings and children in parallel if we have a parent
  if (parent) {
    const [parentChildren, subjectChildren] = await Promise.all([
      getDirectChildren(parent),
      getDirectChildren(subjectPath),
    ])

    const siblings = parentChildren
      .filter((child) => child.segment !== subject)
      .map((child) => ({
        ...child,
        isSchemaDefinition: false,
        fullPath: `${parent}.${child.segment}`,
      }))

    const children = subjectChildren.map((child) => ({
      ...child,
      isSchemaDefinition: false,
      fullPath: `${subjectPath}.${child.segment}`,
    }))

    return { parent, subject, siblings, children }
  }

  // Root namespace (2 segments) - no parent, no siblings
  const subjectChildren = await getDirectChildren(subjectPath)
  const children = subjectChildren.map((child) => ({
    ...child,
    isSchemaDefinition: false,
    fullPath: `${subjectPath}.${child.segment}`,
  }))

  return { parent: null, subject, siblings: [], children }
}

export interface NamespaceChild {
  segment: string
  fullPath: string
  isLexicon: boolean
  lexiconCount: number
  description: string | null
}

/**
 * Gets namespace data for rendering the namespace page
 */
export async function getNamespaceData(
  prefix: string,
): Promise<{ children: NamespaceChild[] }> {
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
