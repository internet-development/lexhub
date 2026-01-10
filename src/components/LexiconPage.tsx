import { codeToHtml } from 'shiki'
import { Card } from '@/components/Card'
import {
  DetailsGroupControls,
  DetailsGroupProvider,
} from '@/components/DetailsGroup'
import { Readme } from '@/components/Readme'
import { SchemaDefinition } from '@/components/SchemaDefinition'
import { VersionDropdown } from '@/components/VersionDropdown'
import { compareDefNames } from '@/util/sort'
import type { LexiconDoc } from '@atproto/lexicon'
import type { LexiconVersion } from '@/db/queries'
import styles from './LexiconPage.module.css'

export interface LexiconPageProps {
  lexicon: LexiconDoc
  currentCid: string
  versions: LexiconVersion[]
}

export async function LexiconPage({
  lexicon,
  currentCid,
  versions,
}: LexiconPageProps) {
  const defs = Object.entries(lexicon.defs ?? {}).sort(([a], [b]) =>
    compareDefNames(a, b),
  )

  const highlightedDefs = await Promise.all(
    defs.map(async ([name, def]) => {
      const json = JSON.stringify(def, null, 2)
      const highlighted = await codeToHtml(json, {
        lang: 'json',
        theme: 'github-light',
      })
      return { name, def, highlightedJson: highlighted }
    }),
  )

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{lexicon.id}</h1>
          <VersionDropdown
            nsid={lexicon.id}
            currentCid={currentCid}
            versions={versions}
          />
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
            {highlightedDefs.map(({ name, def, highlightedJson }) => (
              <li className={styles.defItem} id={name} key={name}>
                <SchemaDefinition
                  name={name}
                  def={def}
                  highlightedJson={highlightedJson}
                />
              </li>
            ))}
          </ul>
        </DetailsGroupProvider>
      </Card>
    </article>
  )
}
