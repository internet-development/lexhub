import Link from '@/components/Link'
import CubeIcon from '@/components/CubeIcon'
import type { TreeData, TreeNode } from '@/app/[id]/data'
import styles from './NamespaceTree.module.css'

export type NamespaceTreeProps = TreeData

const ITEM_HEIGHT = 28
const INDENT_WIDTH = 16
const TRUNK_X = 6
const CURVE_RADIUS = 1
const LABEL_GAP = 4
const CHILD_TRUNK_OFFSET_Y = 12
const TRUNK_START_Y = 0

type PositionedNode = {
  node: TreeNode
  depth: number
  index: number
}

type ConnectorPathData = {
  key: string
  startY: number
  endY: number
  endX: number
  depth: number
  active: boolean
}

/**
 * Walks a tree depth-first, calling visitor for each node.
 * Returns the next index after processing the subtree.
 */
function walkTree(
  nodes: TreeNode[],
  depth: number,
  startIndex: number,
  visitor: (node: TreeNode, depth: number, index: number) => void,
): number {
  let index = startIndex
  for (const node of nodes) {
    visitor(node, depth, index)
    index++
    index = walkTree(node.children, depth + 1, index, visitor)
  }
  return index
}

const getY = (index: number) => index * ITEM_HEIGHT + ITEM_HEIGHT / 2
const getX = (depth: number) => (depth + 1) * INDENT_WIDTH

/**
 * Draws an L-shaped path from the trunk to an item.
 */
function ConnectorPath({
  startY,
  endY,
  endX,
  depth,
  active,
}: Omit<ConnectorPathData, 'key'>) {
  const trunkOffset = depth > 0 ? LABEL_GAP : 0
  const x = endX - INDENT_WIDTH + TRUNK_X + trunkOffset

  const path = `
    M ${x} ${startY}
    L ${x} ${endY - CURVE_RADIUS}
    Q ${x} ${endY} ${x + CURVE_RADIUS} ${endY}
    L ${endX} ${endY}
  `

  // Path length: vertical + curve (π/2 * r) + horizontal
  const pathLength =
    Math.abs(endY - startY) -
    CURVE_RADIUS +
    CURVE_RADIUS * 1.57 +
    (endX - x - CURVE_RADIUS)

  return (
    <path
      d={path}
      className={active ? styles.connectorActive : styles.connector}
      style={
        active
          ? ({ '--path-length': pathLength } as React.CSSProperties)
          : undefined
      }
    />
  )
}

function ItemPrefix({ node }: { node: TreeNode }) {
  if (node.isLexicon) {
    return <CubeIcon size={14} style={{ marginLeft: -1 }} />
  }
  if (node.isSchemaDefinition) return <span>#</span>
  return null
}

function ItemLabel({ node }: { node: TreeNode }) {
  const style = { marginLeft: LABEL_GAP }
  const variant =
    node.isSubject || node.children.length > 0 ? 'default' : 'muted'

  if (node.isSubject) {
    return (
      <span className={styles.itemLabel} style={style} data-subject>
        <ItemPrefix node={node} />
        {node.segment}
      </span>
    )
  }

  return (
    <Link
      href={`/${node.fullPath}`}
      variant={variant}
      className={styles.itemLabel}
      style={style}
    >
      <ItemPrefix node={node} />
      {node.segment}
    </Link>
  )
}

export function NamespaceTree({
  parent,
  subjectPath,
  root,
}: NamespaceTreeProps) {
  const isRootNamespace = !parent && root.every((n) => !n.isSubject)

  // Collect positioned nodes and connector paths via tree walk
  const items: PositionedNode[] = []
  const paths: ConnectorPathData[] = []
  const trunkStartIndex = new Map<number, number>()

  walkTree(root, 0, 0, (node, depth, index) => {
    items.push({ node, depth, index })

    // Track trunk start for each depth level
    // For children (depth > 0), trunk starts from parent (subject)
    if (!trunkStartIndex.has(depth)) {
      trunkStartIndex.set(depth, index)
    }

    const startY =
      depth === 0
        ? TRUNK_START_Y
        : getY(trunkStartIndex.get(depth)! - 1) + CHILD_TRUNK_OFFSET_Y

    paths.push({
      key: node.fullPath,
      startY,
      endY: getY(index),
      endX: getX(depth),
      depth,
      active: node.isSubject,
    })
  })

  const svgHeight = items.length * ITEM_HEIGHT
  const maxDepth = Math.max(...items.map((i) => i.depth), 0)
  const svgWidth = (maxDepth + 2) * INDENT_WIDTH

  return (
    <nav className={styles.root} aria-label="Namespace navigation">
      <div className={styles.header}>
        {isRootNamespace ? (
          <span className={styles.headerName}>{subjectPath}</span>
        ) : (
          <Link
            href={`/${parent}`}
            variant="muted"
            className={styles.headerLink}
          >
            {parent}
          </Link>
        )}
      </div>

      <div className={styles.treeContainer}>
        <svg
          className={styles.connectors}
          width={svgWidth}
          height={svgHeight}
          aria-hidden="true"
        >
          {/* Sort so active paths render last (on top) */}
          {paths
            .toSorted((a, b) => Number(a.active) - Number(b.active))
            .map(({ key, ...rest }) => (
              <ConnectorPath key={key} {...rest} />
            ))}
        </svg>

        <ul className={styles.tree}>
          {items.map(({ node, depth }) => (
            <li
              key={node.fullPath}
              className={styles.item}
              style={{ paddingLeft: getX(depth) }}
            >
              <ItemLabel node={node} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
