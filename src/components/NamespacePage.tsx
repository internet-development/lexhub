import Link from '@/components/Link'
import { Card } from '@/components/Card'
import CubeIcon from '@/components/CubeIcon'
import { VersionDropdown } from '@/components/VersionDropdown'
import styles from './NamespacePage.module.css'
import { Readme } from './Readme'
import { ReadmeContent } from './ReadmeContent'

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
        <span className={styles.title}>{prefix}</span>
        <VersionDropdown />
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

        <section className={styles.readme}>
          <h2 className={styles.readmeTitle}>README</h2>
          <Readme type="namespace">
            <ReadmeContent nsid={prefix} type="namespace" />
          </Readme>
        </section>
      </Card>
    </article>
  )
}
