import { db } from '@/db'
import { valid_lexicons } from '@/db/schema'
import { desc, eq, like, sql } from 'drizzle-orm'
import type { LexiconDoc } from '@atproto/lexicon'
import { isValidNsid } from '@atproto/syntax'
import { isValidNamespacePrefix } from '@/util/nsid'

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
  fullPath: string
  isLexicon: boolean
  isSchemaDefinition: boolean
  isSubject: boolean
  children: TreeNode[]
}

export interface TreeData {
  parent: string | null
  subjectPath: string
  root: TreeNode[]
}

/**
 * Gets tree data for sidebar navigation.
 * Returns a recursive tree structure with the subject's siblings at root level,
 * and the subject's children nested under it.
 */
export async function getTreeData(
  subjectPath: string,
  lexiconDoc: LexiconDoc | null,
): Promise<TreeData> {
  const segments = subjectPath.split('.')
  const subject = segments[segments.length - 1]
  const parent = segments.length > 2 ? segments.slice(0, -1).join('.') : null

  // Helper to create a TreeNode
  const makeNode = (
    segment: string,
    fullPath: string,
    opts: {
      isLexicon?: boolean
      isSchemaDefinition?: boolean
      isSubject?: boolean
      children?: TreeNode[]
    } = {},
  ): TreeNode => ({
    segment,
    fullPath,
    isLexicon: opts.isLexicon ?? false,
    isSchemaDefinition: opts.isSchemaDefinition ?? false,
    isSubject: opts.isSubject ?? false,
    children: opts.children ?? [],
  })

  // Build subject's children
  let subjectChildren: TreeNode[] = []
  if (lexiconDoc) {
    // For lexicons, children are schema definitions
    const defs = lexiconDoc.defs ?? {}
    subjectChildren = Object.keys(defs)
      .sort()
      .map((defName) =>
        makeNode(`${defName}`, `${subjectPath}#${defName}`, {
          isSchemaDefinition: true,
        }),
      )
  } else if (parent) {
    // For namespaces with parent, fetch direct children
    const children = await getDirectChildren(subjectPath)
    subjectChildren = children.map((c) =>
      makeNode(c.segment, `${subjectPath}.${c.segment}`, {
        isLexicon: c.isLexicon,
      }),
    )
  }

  // Root namespace (2 segments) - just show children at root level
  if (!parent) {
    const children = await getDirectChildren(subjectPath)
    return {
      parent: null,
      subjectPath,
      root: children.map((c) =>
        makeNode(c.segment, `${subjectPath}.${c.segment}`, {
          isLexicon: c.isLexicon,
        }),
      ),
    }
  }

  // Fetch siblings and build root tree
  const parentChildren = await getDirectChildren(parent)
  const root = parentChildren
    .map((c) => {
      const isSubject = c.segment === subject
      return makeNode(c.segment, `${parent}.${c.segment}`, {
        isLexicon: c.isLexicon,
        isSubject,
        children: isSubject ? subjectChildren : [],
      })
    })
    .sort((a, b) => a.segment.localeCompare(b.segment))

  return { parent, subjectPath, root }
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

// Page data types
export type LexiconPageData = {
  type: 'lexicon'
  treeData: TreeData
  lexicon: LexiconDoc
}

export type NamespacePageData = {
  type: 'namespace'
  treeData: TreeData
  prefix: string
  children: NamespaceChild[]
}

export type PageData = LexiconPageData | NamespacePageData

/**
 * Gets all data needed to render a page for a given path.
 * Returns null if the path is invalid or has no content.
 */
export async function getPageData(path: string): Promise<PageData | null> {
  // Check for lexicon document first
  if (isValidNsid(path)) {
    const lexicon = await getLexiconByNsid(path)
    if (lexicon) {
      const treeData = await getTreeData(path, lexicon)
      return { type: 'lexicon', treeData, lexicon }
    }
  }

  // Check for namespace prefix
  const isValidPath = isValidNsid(path) || isValidNamespacePrefix(path)
  if (!isValidPath) return null

  const hasChildren = await hasLexiconsUnderPrefix(path)
  if (!hasChildren) return null

  const [treeData, { children }] = await Promise.all([
    getTreeData(path, null),
    getNamespaceData(path),
  ])

  return { type: 'namespace', treeData, prefix: path, children }
}
