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
  const radius = 6
  const path = `M ${x} ${y - radius} Q ${x} ${y} ${x + radius} ${y} L ${x + width} ${y}`

  return (
    <path
      d={path}
      className={active ? styles.connectorPathActive : styles.connectorPath}
    />
  )
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

  type RenderItem = {
    key: string
    node: TreeNode
    depth: number
    isSubject?: boolean
    isChild?: boolean // child of subject (part of active path)
    variant?: 'default' | 'muted'
  }

  const items: RenderItem[] = []

  if (isRootNamespace) {
    children.forEach((child) => {
      items.push({
        key: child.segment,
        node: child,
        depth: 0,
      })
    })
  } else {
    // Subject node
    items.push({
      key: 'subject',
      node: { segment: subject, fullPath: subjectPath, isLexicon: false },
      depth: 0,
      isSubject: true,
    })

    // Children of subject (active path)
    children.forEach((child) => {
      items.push({
        key: `child-${child.segment}`,
        node: child,
        depth: 1,
        isChild: true,
      })
    })

    // Siblings
    siblings.forEach((sibling) => {
      items.push({
        key: `sibling-${sibling.segment}`,
        node: sibling,
        depth: 0,
        variant: 'muted',
      })
    })
  }

  const svgHeight = items.length * ITEM_HEIGHT
  const maxDepth = Math.max(...items.map((item) => item.depth), 0)
  const svgWidth = (maxDepth + 1) * INDENT_WIDTH + CONNECTOR_OFFSET

  const connectors: React.ReactNode[] = []

  // Track vertical line ranges per depth, separately for active/inactive
  const activeRange: { start: number; end: number } | null =
    children.length > 0
      ? {
          start: ITEM_HEIGHT / 2,
          end: children.length * ITEM_HEIGHT + ITEM_HEIGHT / 2,
        }
      : null

  const inactiveRange = hasSiblings
    ? {
        start: ITEM_HEIGHT / 2,
        end: (items.length - 1) * ITEM_HEIGHT + ITEM_HEIGHT / 2,
      }
    : null

  items.forEach((item, index) => {
    const y = index * ITEM_HEIGHT + ITEM_HEIGHT / 2
    const x = item.depth * INDENT_WIDTH + CONNECTOR_OFFSET
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

  // Vertical line for children (active, depth 1)
  if (activeRange && children.length > 0) {
    connectors.push(
      <VerticalLine
        key="v-active"
        x={INDENT_WIDTH + CONNECTOR_OFFSET}
        fromY={activeRange.start}
        toY={activeRange.end}
        active
      />,
    )
  }

  // Vertical line for main trunk (inactive, depth 0)
  if (inactiveRange && !isRootNamespace) {
    connectors.push(
      <VerticalLine
        key="v-main"
        x={CONNECTOR_OFFSET}
        fromY={inactiveRange.start}
        toY={inactiveRange.end}
      />,
    )
  }

  // Vertical line for root namespace (no subject)
  if (isRootNamespace && items.length > 1) {
    connectors.push(
      <VerticalLine
        key="v-root"
        x={CONNECTOR_OFFSET}
        fromY={ITEM_HEIGHT / 2}
        toY={(items.length - 1) * ITEM_HEIGHT + ITEM_HEIGHT / 2}
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
