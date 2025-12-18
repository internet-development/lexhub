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

function TreeBranch({ isLast, indent }: { isLast: boolean; indent?: string }) {
  return (
    <span className={styles.branch}>
      {indent}
      {isLast ? '└─' : '├─'}
    </span>
  )
}

interface TreeItemLinkProps {
  node: TreeNode
  variant?: 'default' | 'muted'
}

function TreeItemLink({ node, variant = 'default' }: TreeItemLinkProps) {
  return (
    <Link href={`/${node.fullPath}`} variant={variant} className={styles.link}>
      {node.segment}
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
  const hasSiblings = siblings.length > 0

  return (
    <nav className={styles.root} aria-label="Namespace navigation">
      {isRootNamespace ? (
        <div className={styles.rootHeader}>
          <span className={styles.rootName}>{subjectPath}</span>
        </div>
      ) : (
        parent && (
          <div className={styles.parent}>
            <Link href={`/${parent}`} variant="muted" className={styles.link}>
              {parent}
            </Link>
          </div>
        )
      )}

      <ul className={styles.tree}>
        {!isRootNamespace && (
          <li className={styles.item}>
            <div className={styles.subject}>
              <TreeBranch isLast={!hasSiblings} />
              <span className={styles.subjectName}>{subject}</span>
            </div>

            {children.length > 0 && (
              <ul className={styles.children}>
                {children.map((child, i) => (
                  <li key={child.segment} className={styles.childItem}>
                    <TreeBranch
                      isLast={i === children.length - 1}
                      indent={hasSiblings ? '│  ' : '   '}
                    />
                    <TreeItemLink node={child} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        )}

        {isRootNamespace &&
          children.map((child, i) => (
            <li key={child.segment} className={styles.item}>
              <TreeBranch isLast={i === children.length - 1} />
              <TreeItemLink node={child} />
            </li>
          ))}

        {siblings.map((sibling, i) => (
          <li key={sibling.segment} className={styles.item}>
            <TreeBranch isLast={i === siblings.length - 1} />
            <TreeItemLink node={sibling} variant="muted" />
          </li>
        ))}
      </ul>
    </nav>
  )
}
