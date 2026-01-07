import Link from '@/components/Link'
import { Card } from '@/components/Card'
import CubeIcon from '@/components/icons/CubeIcon'
import { VersionDropdown } from '@/components/VersionDropdown'
import { Readme } from '@/components/Readme'
import styles from './NamespacePage.module.css'

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
        <div className={styles.titleRow}>
          <span className={styles.title}>{prefix}</span>
          <VersionDropdown />
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
                {child.isLexicon ? 'LEXICON' : 'NAMESPACE'}
              </span>
            </Link>
          ))}
        </div>

        <Readme type="namespace" nsid={prefix} className={styles.readme} />
      </Card>
    </article>
  )
}
