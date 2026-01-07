import type { LexiconDoc } from '@atproto/lexicon'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/Card'
import {
  DetailsGroupProvider,
  DetailsGroupControls,
} from '@/components/DetailsGroup'
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
        <Breadcrumbs path={lexicon.id} className={styles.breadcrumbs} />
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{lexicon.id}</h1>
          <VersionDropdown />
        </div>
      </header>

      <Card width="full" className={styles.card}>
        <Readme type="lexicon" nsid={lexicon.id} className={styles.readme} />
        <DetailsGroupProvider>
          <div className={styles.defListHeader}>
            <span className={styles.defCount}>
              {defs.length} definition{defs.length !== 1 ? 's' : ''}
            </span>
            <DetailsGroupControls />
          </div>
          <ul className={styles.defList}>
            {defs.map(([name, def]) => (
              <li className={styles.defItem} id={name} key={name}>
                <SchemaDefinition key={name} name={name} def={def} />
              </li>
            ))}
          </ul>
        </DetailsGroupProvider>
      </Card>
    </article>
  )
}
