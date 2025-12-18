import { db } from '@/db'
import { valid_lexicons } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import type { LexiconDoc } from '@atproto/lexicon'
import { isValidNsid } from '@atproto/syntax'
import { getParentPath, isValidNamespacePrefix } from '@/util/nsid'

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

/** Direct child from DB query */
type DirectChild = { segment: string; isLexicon: boolean }

/**
 * Creates a TreeNode with sensible defaults
 */
function makeTreeNode(
  segment: string,
  fullPath: string,
  opts: Partial<Omit<TreeNode, 'segment' | 'fullPath'>> = {},
): TreeNode {
  return {
    segment,
    fullPath,
    isLexicon: opts.isLexicon ?? false,
    isSchemaDefinition: opts.isSchemaDefinition ?? false,
    isSubject: opts.isSubject ?? false,
    children: opts.children ?? [],
  }
}

/**
 * Transforms a DirectChild to a TreeNode under a given prefix
 */
const childToTreeNode =
  (prefix: string) =>
  (c: DirectChild): TreeNode =>
    makeTreeNode(c.segment, `${prefix}.${c.segment}`, {
      isLexicon: c.isLexicon,
    })

/**
 * Builds subject children from lexicon schema definitions or namespace children
 */
async function getSubjectChildren(
  subjectPath: string,
  lexicon: LexiconDoc | null,
): Promise<TreeNode[]> {
  if (lexicon) {
    return Object.keys(lexicon.defs ?? {})
      .sort()
      .map((defName) =>
        makeTreeNode(defName, `${subjectPath}#${defName}`, {
          isSchemaDefinition: true,
        }),
      )
  }

  const children = await getDirectChildren(subjectPath)
  return children.map(childToTreeNode(subjectPath))
}

/**
 * Gets tree data for sidebar navigation.
 * Returns a recursive tree structure with the subject's siblings at root level,
 * and the subject's children nested under it.
 *
 * @param subjectPath - The path being viewed
 * @param lexiconDoc - Optional pre-fetched lexicon doc (to avoid re-fetching)
 */
async function getTreeData(
  subjectPath: string,
  lexiconDoc?: LexiconDoc | null,
): Promise<TreeData> {
  const subject = subjectPath.split('.').at(-1)!
  const parent = getParentPath(subjectPath)

  // Fetch lexicon if not provided and path is valid NSID
  const lexicon =
    lexiconDoc ??
    (isValidNsid(subjectPath) ? await getLexiconByNsid(subjectPath) : null)

  // Root namespace - just show children at root level
  if (!parent) {
    const children = await getDirectChildren(subjectPath)
    return {
      parent: null,
      subjectPath,
      root: children.map(childToTreeNode(subjectPath)),
    }
  }

  // Fetch subject children and siblings in parallel
  const [subjectChildren, siblings] = await Promise.all([
    getSubjectChildren(subjectPath, lexicon),
    getDirectChildren(parent),
  ])

  // Build root tree from siblings, nesting subject children
  const root = siblings.map((c) => {
    const isSubject = c.segment === subject
    return makeTreeNode(c.segment, `${parent}.${c.segment}`, {
      isLexicon: c.isLexicon,
      isSubject,
      children: isSubject ? subjectChildren : [],
    })
  })

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

  const [treeData, children] = await Promise.all([
    getTreeData(path),
    getNamespaceChildren(path),
  ])

  // No children means nothing exists under this prefix
  if (children.length === 0) return null

  return { type: 'namespace', treeData, prefix: path, children }
}
