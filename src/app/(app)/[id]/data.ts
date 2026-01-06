import type { LexiconDoc } from '@atproto/lexicon'
import { isValidNsid } from '@atproto/syntax'
import {
  getLexiconByNsid,
  getDirectChildren,
  getNamespaceChildren,
  type NamespaceChild,
} from '@/db/queries'
import { getParentPath, isValidNamespacePrefix } from '@/util/nsid'
import { compareDefNames } from '@/util/sort'

// Tree types

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

// Tree building helpers

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
      .sort(compareDefNames)
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
