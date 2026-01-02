import type { LexiconDoc } from '@atproto/lexicon'
import { Card } from '@/components/Card'
import { VersionDropdown } from '@/components/VersionDropdown'
import { Readme } from '@/components/Readme'
import { SchemaDefinition } from '@/components/SchemaDefinition'
import { compareDefNames } from '@/util/sort'
import styles from './LexiconPage.module.css'

export interface LexiconPageProps {
  lexicon: LexiconDoc
}

export function LexiconPage({ lexicon }: LexiconPageProps) {
  const defs = Object.entries(lexicon.defs ?? {}).sort(([a], [b]) =>
    compareDefNames(a, b),
  )

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>{lexicon.id}</h1>
        <VersionDropdown />
      </header>

      <Card width="full" className={styles.card}>
        <Readme type="lexicon" nsid={lexicon.id} className={styles.readme} />
        <ul className={styles.defList}>
          {defs.map(([name, def]) => (
            <SchemaDefinition key={name} name={name} def={def} />
          ))}
        </ul>
      </Card>
    </article>
  )
}
