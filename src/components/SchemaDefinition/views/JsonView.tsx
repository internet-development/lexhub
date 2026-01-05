import type { LexUserType } from '@atproto/lexicon'
import styles from '../SchemaDefinition.module.css'

export function JsonView({ def }: { def: LexUserType }) {
  return <pre className={styles.schema}>{JSON.stringify(def, null, 2)}</pre>
}
