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

const ITEM_HEIGHT = 28
const INDENT_WIDTH = 16
const CONNECTOR_OFFSET = 8
const CURVE_RADIUS = 4

function VerticalLine({
  fromY,
  toY,
  x,
  active,
}: {
  fromY: number
  toY: number
  x: number
  active?: boolean
}) {
  return (
    <line
      x1={x}
      y1={fromY}
      x2={x}
      y2={toY}
      className={active ? styles.connectorLineActive : styles.connectorLine}
    />
  )
}

function CurvedConnector({
  x,
  y,
  width,
  active,
}: {
  x: number
  y: number
  width: number
  active?: boolean
}) {
  // Curve from vertical line position to item
  // Path: start at (x, y-radius), curve to (x+radius, y), then line to end
  const path = `M ${x} ${y - CURVE_RADIUS} Q ${x} ${y} ${x + CURVE_RADIUS} ${y} L ${x + width} ${y}`

  return (
    <path
      d={path}
      className={active ? styles.connectorPathActive : styles.connectorPath}
    />
  )
}

type RenderItem = {
  key: string
  node: TreeNode
  depth: number
  index: number
  isSubject?: boolean
  isChild?: boolean
  variant?: 'default' | 'muted'
}

export function NamespaceTree({
  parent,
  subject,
  subjectPath,
  siblings,
  children,
}: NamespaceTreeProps) {
  const isRootNamespace = !parent && siblings.length === 0

  const items: RenderItem[] = []
  let index = 0

  if (isRootNamespace) {
    children.forEach((child) => {
      items.push({
        key: child.segment,
        node: child,
        depth: 0,
        index: index++,
      })
    })
  } else {
    // Subject node at depth 0
    items.push({
      key: 'subject',
      node: { segment: subject, fullPath: subjectPath, isLexicon: false },
      depth: 0,
      index: index++,
      isSubject: true,
    })

    // Children of subject at depth 1
    children.forEach((child) => {
      items.push({
        key: `child-${child.segment}`,
        node: child,
        depth: 1,
        index: index++,
        isChild: true,
      })
    })

    // Siblings at depth 0
    siblings.forEach((sibling) => {
      items.push({
        key: `sibling-${sibling.segment}`,
        node: sibling,
        depth: 0,
        index: index++,
        variant: 'muted',
      })
    })
  }

  // Helper to get Y position for an item
  const getY = (idx: number) => idx * ITEM_HEIGHT + ITEM_HEIGHT / 2
  // Helper to get X position for a depth
  const getX = (depth: number) => depth * INDENT_WIDTH + CONNECTOR_OFFSET

  const svgHeight = items.length * ITEM_HEIGHT
  const maxDepth = Math.max(...items.map((item) => item.depth), 0)
  const svgWidth = (maxDepth + 1) * INDENT_WIDTH + CONNECTOR_OFFSET + 4

  const connectors: React.ReactNode[] = []

  // Draw curved connectors for each item
  items.forEach((item) => {
    const y = getY(item.index)
    const x = getX(item.depth)
    const isActive = item.isSubject || item.isChild

    connectors.push(
      <CurvedConnector
        key={`c-${item.key}`}
        x={x}
        y={y}
        width={INDENT_WIDTH - CONNECTOR_OFFSET}
        active={isActive}
      />,
    )
  })

  // Vertical line for depth 0 (main trunk)
  const depth0Items = items.filter((item) => item.depth === 0)
  if (depth0Items.length > 1) {
    const firstY = getY(depth0Items[0].index)
    const lastY = getY(depth0Items[depth0Items.length - 1].index)
    connectors.push(
      <VerticalLine key="v-depth0" x={getX(0)} fromY={firstY} toY={lastY} />,
    )
  }

  // Vertical line for depth 1 (children - active)
  const depth1Items = items.filter((item) => item.depth === 1)
  if (depth1Items.length > 1) {
    const firstY = getY(depth1Items[0].index)
    const lastY = getY(depth1Items[depth1Items.length - 1].index)
    connectors.push(
      <VerticalLine
        key="v-depth1"
        x={getX(1)}
        fromY={firstY}
        toY={lastY}
        active
      />,
    )
  }

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
