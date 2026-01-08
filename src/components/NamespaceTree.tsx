import type { TreeData, TreeNode } from '@/app/(app)/[id]/data'
import Link from '@/components/Link'
import CubeIcon from '@/components/icons/CubeIcon'
import HashIcon from '@/components/icons/HashIcon'
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
  itemX: number
}

type ConnectorPathData = {
  key: string
  startY: number
  endY: number
  trunkX: number
  endX: number
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
const getBaseX = (depth: number) => (depth + 1) * INDENT_WIDTH
const getTrunkOffset = (depth: number) => (depth > 0 ? LABEL_GAP : 0)

/**
 * Draws an L-shaped path from the trunk to an item.
 */
function ConnectorPath({
  startY,
  endY,
  trunkX,
  endX,
  active,
}: Omit<ConnectorPathData, 'key'>) {
  const path = `
    M ${trunkX} ${startY}
    L ${trunkX} ${endY - CURVE_RADIUS}
    Q ${trunkX} ${endY} ${trunkX + CURVE_RADIUS} ${endY}
    L ${endX} ${endY}
  `

  // Path length: vertical + curve (π/2 * r) + horizontal
  const pathLength =
    Math.abs(endY - startY) -
    CURVE_RADIUS +
    CURVE_RADIUS * 1.57 +
    (endX - trunkX - CURVE_RADIUS)

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
  if (node.isLexicon) return <CubeIcon size={14} />
  if (node.isSchemaDefinition) return <HashIcon size={14} />
  return null
}

function ItemLabel({ node, depth }: { node: TreeNode; depth: number }) {
  const style = { marginLeft: LABEL_GAP }
  const variant = node.isSubject ? 'primary' : depth === 0 ? 'muted' : 'subtle'

  return (
    <Link
      href={`/${node.fullPath}`}
      className={styles.itemLabel}
      style={style}
      variant={variant}
      inert={node.isSubject}
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
    const trunkOffset = getTrunkOffset(depth)
    const baseX = getBaseX(depth)
    const itemX = baseX + trunkOffset

    items.push({ node, depth, index, itemX })

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
      trunkX: baseX - INDENT_WIDTH + TRUNK_X + trunkOffset,
      endX: itemX,
      active: node.isSubject,
    })
  })

  const svgHeight = items.length * ITEM_HEIGHT
  const maxDepth = Math.max(...items.map((i) => i.depth), 0)
  const svgWidth = (maxDepth + 2) * INDENT_WIDTH

  return (
    <nav className={styles.root} aria-label="Namespace navigation">
      <div className={styles.header}>
        <Link href={`/${parent}`} variant="default" inert={isRootNamespace}>
          {isRootNamespace ? subjectPath : parent}
        </Link>
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
          {items.map(({ node, itemX, depth }) => (
            <li
              key={node.fullPath}
              className={styles.item}
              style={{ paddingLeft: itemX }}
            >
              <ItemLabel node={node} depth={depth} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
