import type { LexiconDoc, LexUserType } from '@atproto/lexicon'
import { Card } from '@/components/Card'
import { VersionDropdown } from '@/components/VersionDropdown'
import { Readme } from '@/components/Readme'
import styles from './LexiconPage.module.css'

export interface LexiconPageProps {
  lexicon: LexiconDoc
}

export function LexiconPage({ lexicon }: LexiconPageProps) {
  const defs = Object.entries(lexicon.defs ?? {}).sort()

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>{lexicon.id}</h1>
        <VersionDropdown />
      </header>

      <Card width="full" className={styles.card}>
        <section className={styles.readme}>
          <h2 className={styles.sectionTitle}>README</h2>
          <Readme nsid={lexicon.id} type="lexicon" />
        </section>
        <ul className={styles.defList}>
          {defs.map(([name, def]) => (
            <SchemaDefinition key={name} name={name} def={def} />
          ))}
        </ul>
      </Card>
    </article>
  )
}

interface SchemaDefinitionProps {
  name: string
  def: LexUserType
}

function SchemaDefinition({ name, def }: SchemaDefinitionProps) {
  const type = 'type' in def ? def.type : 'unknown'

  return (
    <li className={styles.defItem} id={name}>
      <details className={styles.defDetails}>
        <summary className={styles.defHeader}>
          <span className={styles.defName}>{name}</span>
          <div className={styles.defHeaderRight}>
            <span className={styles.defType}>{type.toUpperCase()}</span>
            <svg
              className={styles.chevron}
              width="20"
              height="20"
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
        </summary>
        <div className={styles.defContent}>
          {'description' in def && def.description && (
            <div className={styles.defDescriptionSection}>
              <span className={styles.defDescriptionLabel}>DESCRIPTION</span>
              <p className={styles.defDescription}>{def.description}</p>
            </div>
          )}
          <div className={styles.defSchema}>
            <pre className={styles.schema}>{JSON.stringify(def, null, 2)}</pre>
          </div>
        </div>
      </details>
    </li>
  )
}

