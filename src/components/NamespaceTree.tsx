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

const ITEM_HEIGHT = 28
const INDENT_WIDTH = 16
const TRUNK_X = 4
const CURVE_RADIUS = 0
const LABEL_GAP = 4
const CHILD_TRUNK_OFFSET_Y = 12

type TreeItem = {
  key: string
  segment: string
  fullPath: string
  depth: number
  isSubject?: boolean
  isChildOfSubject?: boolean
}

/**
 * Draws an L-shaped path from the trunk to an item.
 * Path goes: vertical down to item's Y, then horizontal to item.
 */
function ConnectorPath({
  startY,
  endY,
  endX,
  depth,
  active,
}: {
  startY: number
  endY: number
  endX: number
  depth: number
  active?: boolean
}) {
  // For depth > 0, offset trunk by LABEL_GAP to align with parent text
  const trunkOffset = depth > 0 ? LABEL_GAP : 0
  const x = endX - INDENT_WIDTH + TRUNK_X + trunkOffset

  // If this is the first item at this depth, just draw horizontal
  if (startY === endY) {
    const path = `M ${x} ${endY} L ${endX} ${endY}`
    return (
      <path
        d={path}
        className={active ? styles.connectorActive : styles.connector}
      />
    )
  }

  // L-shape with curved corner: down then right
  const path = `
    M ${x} ${startY}
    L ${x} ${endY - CURVE_RADIUS}
    Q ${x} ${endY} ${x + CURVE_RADIUS} ${endY}
    L ${endX} ${endY}
  `

  return (
    <path
      d={path}
      className={active ? styles.connectorActive : styles.connector}
    />
  )
}

function ItemLabel({
  item,
  variant = 'default',
}: {
  item: TreeItem
  variant?: 'default' | 'muted'
}) {
  const style = { marginLeft: LABEL_GAP }

  if (item.isSubject) {
    return (
      <span className={styles.itemLabel} style={style} data-subject>
        {item.segment}
      </span>
    )
  }

  return (
    <Link
      href={`/${item.fullPath}`}
      variant={variant}
      className={styles.itemLabel}
      style={style}
    >
      {item.segment}
    </Link>
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

  // Build items list - all at depth 0, sorted alphabetically
  // Subject stays in its alphabetical position
  const depth0Items: TreeItem[] = [
    ...siblings.map((s) => ({
      key: s.segment,
      segment: s.segment,
      fullPath: s.fullPath,
      depth: 0,
    })),
    ...(isRootNamespace
      ? []
      : [
          {
            key: 'subject',
            segment: subject,
            fullPath: subjectPath,
            depth: 0,
            isSubject: true,
          },
        ]),
  ].sort((a, b) => a.segment.localeCompare(b.segment))

  // Children of subject at depth 1, sorted alphabetically
  const depth1Items: TreeItem[] = children
    .map((c) => ({
      key: `child-${c.segment}`,
      segment: c.segment,
      fullPath: c.fullPath,
      depth: 1,
      isChildOfSubject: true,
    }))
    .sort((a, b) => a.segment.localeCompare(b.segment))

  // For root namespace, just show children at depth 0
  const rootItems: TreeItem[] = isRootNamespace
    ? children
        .map((c) => ({
          key: c.segment,
          segment: c.segment,
          fullPath: c.fullPath,
          depth: 0,
        }))
        .sort((a, b) => a.segment.localeCompare(b.segment))
    : []

  // Build final flat list with children inserted after subject
  const items: TreeItem[] = isRootNamespace
    ? rootItems
    : depth0Items.flatMap((item) =>
        item.isSubject ? [item, ...depth1Items] : [item],
      )

  // Calculate positions
  const getY = (index: number) => index * ITEM_HEIGHT + ITEM_HEIGHT / 2
  const getX = (depth: number) => (depth + 1) * INDENT_WIDTH

  const svgHeight = items.length * ITEM_HEIGHT
  const maxDepth = Math.max(...items.map((i) => i.depth), 0)
  const svgWidth = (maxDepth + 2) * INDENT_WIDTH

  // Find trunk start positions:
  // - Depth 0: first item at depth 0 (siblings share a trunk)
  // - Depth 1: subject's position (children branch from subject)
  const subjectIndex = items.findIndex((item) => item.isSubject)
  const firstIndexAtDepth: Record<number, number> = {}
  items.forEach((item, index) => {
    if (firstIndexAtDepth[item.depth] === undefined) {
      // Children (depth 1) should start from subject, not first child
      firstIndexAtDepth[item.depth] = item.depth === 1 ? subjectIndex : index
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
          {/* Inactive paths first (background) */}
          {items.map((item, index) => {
            if (item.isSubject) return null
            const startIndex = firstIndexAtDepth[item.depth]
            const startYOffset = item.depth > 0 ? CHILD_TRUNK_OFFSET_Y : 0
            return (
              <ConnectorPath
                key={item.key}
                startY={getY(startIndex) + startYOffset}
                endY={getY(index)}
                endX={getX(item.depth)}
                depth={item.depth}
              />
            )
          })}
          {/* Subject path last (foreground, animated) */}
          {items.map((item, index) => {
            if (!item.isSubject) return null
            const startIndex = firstIndexAtDepth[item.depth]
            return (
              <ConnectorPath
                key={item.key}
                startY={getY(startIndex)}
                endY={getY(index)}
                endX={getX(item.depth)}
                depth={item.depth}
                active
              />
            )
          })}
        </svg>

        <ul className={styles.tree}>
          {items.map((item) => (
            <li
              key={item.key}
              className={styles.item}
              style={{ paddingLeft: getX(item.depth) }}
            >
              <ItemLabel
                item={item}
                variant={
                  item.isSubject || item.isChildOfSubject ? 'default' : 'muted'
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
