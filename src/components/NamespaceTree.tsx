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

export function NamespaceTree({
  parent,
  subject,
  subjectPath,
  siblings,
  children,
}: NamespaceTreeProps) {
  // Sort all items: subject first, then sorted siblings
  const sortedSiblings = [...siblings].sort((a, b) =>
    a.segment.localeCompare(b.segment),
  )

  return (
    <nav className={styles.root} aria-label="Namespace navigation">
      {parent && (
        <div className={styles.parent}>
          <Link
            href={`/${parent}`}
            variant="muted"
            className={styles.parentLink}
          >
            {parent}
          </Link>
        </div>
      )}

      <ul className={styles.tree}>
        {/* Subject with its children */}
        <li className={styles.item}>
          <div className={styles.subject}>
            <span className={styles.branch}>
              {sortedSiblings.length > 0 ? '├─' : '└─'}
            </span>
            <span className={styles.subjectName}>{subject}</span>
          </div>

          {children.length > 0 && (
            <ul className={styles.children}>
              {children.map((child, index) => (
                <li key={child.segment} className={styles.childItem}>
                  <span className={styles.childBranch}>
                    {sortedSiblings.length > 0 ? '│  ' : '   '}
                    {index === children.length - 1 ? '└─' : '├─'}
                  </span>
                  {child.fullPath.includes('#') ? (
                    // Schema def - link to anchor
                    <Link
                      href={`/${subjectPath}#${child.segment}`}
                      variant="default"
                      className={styles.childLink}
                    >
                      {child.segment}
                    </Link>
                  ) : (
                    <Link
                      href={`/${child.fullPath}`}
                      variant="default"
                      className={styles.childLink}
                    >
                      {child.segment}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>

        {/* Siblings (no children shown) */}
        {sortedSiblings.map((sibling, index) => (
          <li key={sibling.segment} className={styles.item}>
            <span className={styles.branch}>
              {index === sortedSiblings.length - 1 ? '└─' : '├─'}
            </span>
            <Link
              href={`/${sibling.fullPath}`}
              variant="muted"
              className={styles.siblingLink}
            >
              {sibling.segment}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
