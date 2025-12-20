import Link from '@/components/Link'
import { Card } from '@/components/Card'
import CubeIcon from '@/components/CubeIcon'
import styles from './NamespacePage.module.css'
import { Readme } from './Readme'

export interface NamespacePageProps {
  prefix: string
  children: Array<{
    segment: string
    fullPath: string
    isLexicon: boolean
    lexiconCount: number
    description: string | null
  }>
}

export function NamespacePage({ prefix, children }: NamespacePageProps) {
  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>{prefix}</h1>
        <div className={styles.versionDropdown}>
          <span>Version History</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </header>

      <Card width="full" className={styles.card}>
        <div className={styles.grid}>
          {children.map((child) => (
            <Link
              key={child.segment}
              href={`/${child.fullPath}`}
              variant="default"
              className={styles.gridItem}
            >
              <div className={styles.itemLeft}>
                <CubeIcon size={18} className={styles.itemIcon} />
                <span className={styles.itemName}>{child.segment}</span>
              </div>
              <span className={styles.itemType}>
                {child.isLexicon ? 'QUERY' : '—'}
              </span>
            </Link>
          ))}
        </div>

        <section className={styles.readme}>
          <h2 className={styles.readmeTitle}>README</h2>
          <Readme nsid={prefix} />
        </section>
      </Card>
    </article>
  )
}
