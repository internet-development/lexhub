import Link from '@/components/Link'
import type { TreeNode } from '@/db/queries'
import styles from './NamespaceTree.module.css'

export interface NamespaceTreeProps {
  parent: string | null
  subject: string
  subjectPath: string
  siblings: TreeNode[]
  children: TreeNode[]
}

interface TreeItemProps {
  node: TreeNode
  isSubject?: boolean
  variant?: 'default' | 'muted'
}

function TreeItem({ node, isSubject, variant = 'default' }: TreeItemProps) {
  if (isSubject) {
    return (
      <span className={styles.itemLabel} data-subject>
        {node.segment}
      </span>
    )
  }

  return (
    <Link
      href={`/${node.fullPath}`}
      variant={variant}
      className={styles.itemLabel}
    >
      {node.segment}
    </Link>
  )
}

/**
 * SVG path drawing utilities
 */
const ITEM_HEIGHT = 28
const INDENT_WIDTH = 16
const CONNECTOR_OFFSET = 8 // horizontal offset from left edge to vertical line

function VerticalLine({
  fromY,
  toY,
  x,
}: {
  fromY: number
  toY: number
  x: number
}) {
  return (
    <line x1={x} y1={fromY} x2={x} y2={toY} className={styles.connectorLine} />
  )
}

function CurvedConnector({
  x,
  y,
  width,
}: {
  x: number
  y: number
  width: number
}) {
  // Draw a curved path from vertical line to item
  const radius = 6
  const path = `M ${x} ${y - radius} Q ${x} ${y} ${x + radius} ${y} L ${x + width} ${y}`

  return <path d={path} className={styles.connectorPath} />
}

export function NamespaceTree({
  parent,
  subject,
  subjectPath,
  siblings,
  children,
}: NamespaceTreeProps) {
  const isRootNamespace = !parent && siblings.length === 0
  const hasSiblings = siblings.length > 0

  // Build flat list of all items for rendering
  type RenderItem = {
    key: string
    node: TreeNode
    depth: number
    isSubject?: boolean
    isLastAtDepth?: boolean
    variant?: 'default' | 'muted'
  }

  const items: RenderItem[] = []

  if (isRootNamespace) {
    // Root namespace: just show children at depth 0
    children.forEach((child, i) => {
      items.push({
        key: child.segment,
        node: child,
        depth: 0,
        isLastAtDepth: i === children.length - 1,
      })
    })
  } else {
    // Subject node
    items.push({
      key: 'subject',
      node: { segment: subject, fullPath: subjectPath, isLexicon: false },
      depth: 0,
      isSubject: true,
      isLastAtDepth: !hasSiblings,
    })

    // Children of subject
    children.forEach((child, i) => {
      items.push({
        key: `child-${child.segment}`,
        node: child,
        depth: 1,
        isLastAtDepth: i === children.length - 1,
      })
    })

    // Siblings
    siblings.forEach((sibling, i) => {
      items.push({
        key: `sibling-${sibling.segment}`,
        node: sibling,
        depth: 0,
        isLastAtDepth: i === siblings.length - 1,
        variant: 'muted',
      })
    })
  }

  // Calculate SVG dimensions
  const svgHeight = items.length * ITEM_HEIGHT
  const maxDepth = Math.max(...items.map((item) => item.depth), 0)
  const svgWidth = (maxDepth + 1) * INDENT_WIDTH + CONNECTOR_OFFSET

  // Generate connector paths
  const connectors: React.ReactNode[] = []

  // Track vertical line segments needed at each depth
  const depthRanges: Map<number, { start: number; end: number }> = new Map()

  items.forEach((item, index) => {
    const y = index * ITEM_HEIGHT + ITEM_HEIGHT / 2
    const x = item.depth * INDENT_WIDTH + CONNECTOR_OFFSET

    // Horizontal connector to this item
    connectors.push(
      <CurvedConnector
        key={`h-${item.key}`}
        x={x}
        y={y}
        width={INDENT_WIDTH - CONNECTOR_OFFSET}
      />,
    )

    // Track vertical line range at this depth
    const existing = depthRanges.get(item.depth)
    if (existing) {
      existing.end = y
    } else {
      depthRanges.set(item.depth, { start: y, end: y })
    }
  })

  // Draw vertical lines for each depth
  depthRanges.forEach((range, depth) => {
    if (range.start !== range.end) {
      const x = depth * INDENT_WIDTH + CONNECTOR_OFFSET
      connectors.push(
        <VerticalLine
          key={`v-${depth}`}
          x={x}
          fromY={range.start}
          toY={range.end}
        />,
      )
    }
  })

  return (
    <nav className={styles.root} aria-label="Namespace navigation">
      {isRootNamespace ? (
        <div className={styles.header}>
          <span className={styles.headerName}>{subjectPath}</span>
        </div>
      ) : (
        parent && (
          <div className={styles.header}>
            <Link
              href={`/${parent}`}
              variant="muted"
              className={styles.headerLink}
            >
              {parent}
            </Link>
          </div>
        )
      )}

      <div className={styles.treeContainer}>
        <svg
          className={styles.connectors}
          width={svgWidth}
          height={svgHeight}
          aria-hidden="true"
        >
          {connectors}
        </svg>

        <ul className={styles.tree}>
          {items.map((item) => (
            <li
              key={item.key}
              className={styles.item}
              style={{ paddingLeft: item.depth * INDENT_WIDTH + INDENT_WIDTH }}
            >
              <TreeItem
                node={item.node}
                isSubject={item.isSubject}
                variant={item.variant}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
