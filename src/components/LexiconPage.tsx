import type { LexiconDoc, LexUserType } from '@atproto/lexicon'
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
        {lexicon.description && (
          <p className={styles.description}>{lexicon.description}</p>
        )}
      </header>

      <section className={styles.definitions}>
        <h2 className={styles.sectionTitle}>Definitions</h2>
        <ul className={styles.defList}>
          {defs.map(([name, def]) => (
            <SchemaDefinition key={name} name={name} def={def} />
          ))}
        </ul>
      </section>
    </article>
  )
}

interface SchemaDefinitionProps {
  name: string
  def: LexUserType
}

function SchemaDefinition({ name, def }: SchemaDefinitionProps) {
  return (
    <li className={styles.defItem} id={name}>
      <div className={styles.defHeader}>
        <code className={styles.defName}>{name}</code>
        {'type' in def && <span className={styles.defType}>{def.type}</span>}
      </div>
      {'description' in def && def.description && (
        <p className={styles.defDescription}>{def.description}</p>
      )}
      <details className={styles.defDetails}>
        <summary>Schema</summary>
        <pre className={styles.schema}>{JSON.stringify(def, null, 2)}</pre>
      </details>
    </li>
  )
}
