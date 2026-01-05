import type { LexObject, LexRecord } from '@atproto/lexicon'
import { FieldTable } from '../FieldTable'
import { extractObjectFields } from '../utils/fields'
import styles from '../SchemaDefinition.module.css'

type ObjectDef = LexObject | LexRecord

export function ObjectTypeView({ def }: { def: ObjectDef }) {
  const fields =
    def.type === 'record'
      ? extractObjectFields(
          def.record.properties,
          def.record.required,
          def.record.nullable,
        )
      : extractObjectFields(def.properties, def.required, def.nullable)

  if (fields.length === 0) {
    return (
      <div className={styles.noFields}>
        No data fields available for this type.
      </div>
    )
  }

  return <FieldTable fields={fields} />
}
