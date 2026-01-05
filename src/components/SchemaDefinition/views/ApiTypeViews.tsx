import type {
  LexXrpcProcedure,
  LexXrpcQuery,
  LexXrpcSubscription,
} from '@atproto/lexicon'
import { FieldSection } from '../FieldTable'
import { extractParamFields, extractBodyFields } from '../utils/fields'
import styles from '../SchemaDefinition.module.css'

export function QueryTypeView({ def }: { def: LexXrpcQuery }) {
  const paramFields = extractParamFields(def.parameters)
  const outputFields = extractBodyFields(def.output)

  if (paramFields.length === 0 && outputFields.length === 0) {
    return <div className={styles.noFields}>No data fields available.</div>
  }

  return (
    <div className={styles.fieldSections}>
      <FieldSection title="Parameters" fields={paramFields} />
      <FieldSection title="Output" fields={outputFields} />
    </div>
  )
}

export function ProcedureTypeView({ def }: { def: LexXrpcProcedure }) {
  const paramFields = extractParamFields(def.parameters)
  const inputFields = extractBodyFields(def.input)
  const outputFields = extractBodyFields(def.output)

  if (
    paramFields.length === 0 &&
    inputFields.length === 0 &&
    outputFields.length === 0
  ) {
    return <div className={styles.noFields}>No data fields available.</div>
  }

  return (
    <div className={styles.fieldSections}>
      <FieldSection title="Parameters" fields={paramFields} />
      <FieldSection title="Input" fields={inputFields} />
      <FieldSection title="Output" fields={outputFields} />
    </div>
  )
}

export function SubscriptionTypeView({ def }: { def: LexXrpcSubscription }) {
  const paramFields = extractParamFields(def.parameters)

  if (paramFields.length === 0) {
    return <div className={styles.noFields}>No data fields available.</div>
  }

  return (
    <div className={styles.fieldSections}>
      <FieldSection title="Parameters" fields={paramFields} />
    </div>
  )
}
