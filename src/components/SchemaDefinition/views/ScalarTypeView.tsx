import type { LexUserType } from '@atproto/lexicon'
import type { LexProperty } from '../utils/types'
import { compactConstraints, constraint, join } from '../utils/constraints'
import { getTypeString } from '../TypeDisplay'
import styles from '../SchemaDefinition.module.css'

interface ScalarProperty {
  name: string
  value: string
}

function compactProperties(
  ...items: (ScalarProperty | null)[]
): ScalarProperty[] {
  return items.filter((x): x is ScalarProperty => x !== null)
}

/** Return a property if value is defined, otherwise null */
function property(
  name: string,
  value: unknown,
  format: (v: never) => string = String,
): ScalarProperty | null {
  if (value === undefined) return null
  return { name, value: format(value as never) }
}

function getScalarProperties(def: LexUserType): ScalarProperty[] {
  switch (def.type) {
    case 'string':
      return compactProperties(
        property('type', def.format ? `string (${def.format})` : 'string'),
        property('default', def.default, JSON.stringify),
        property('const', def.const, JSON.stringify),
        property('enum', def.enum, join),
        property('known values', def.knownValues, join),
        property('minLength', def.minLength),
        property('maxLength', def.maxLength),
        property('minGraphemes', def.minGraphemes),
        property('maxGraphemes', def.maxGraphemes),
      )
    case 'integer':
      return compactProperties(
        property('type', 'integer'),
        property('default', def.default, JSON.stringify),
        property('const', def.const, JSON.stringify),
        property('enum', def.enum, join),
        property('min', def.minimum),
        property('max', def.maximum),
      )
    case 'boolean':
      return compactProperties(
        property('type', 'boolean'),
        property('default', def.default, JSON.stringify),
        property('const', def.const, JSON.stringify),
      )
    case 'bytes':
      return compactProperties(
        property('type', 'bytes'),
        property('minLength', def.minLength),
        property('maxLength', def.maxLength),
      )
    case 'blob':
      return compactProperties(
        property('type', 'blob'),
        property('accept', def.accept, join),
        property('maxSize', def.maxSize),
      )
    case 'array':
      return compactProperties(
        property('type', 'array'),
        property('items', getTypeString(def.items)),
        property('minLength', def.minLength),
        property('maxLength', def.maxLength),
      )
    case 'cid-link':
      return compactProperties(property('type', 'cid-link'))
    case 'unknown':
      return compactProperties(property('type', 'unknown'))
    default:
      return compactProperties(property('type', def.type))
  }
}

export function ScalarTypeView({ def }: { def: LexUserType }) {
  const properties = getScalarProperties(def)

  if (properties.length === 0) {
    return (
      <div className={styles.noFields}>
        No additional type information available.
      </div>
    )
  }

  return (
    <table className={styles.fieldTable}>
      <thead>
        <tr>
          <th className={styles.fieldTableHead}>Property</th>
          <th className={styles.fieldTableHead}>Value</th>
        </tr>
      </thead>
      <tbody>
        {properties.map((prop) => (
          <tr key={prop.name} className={styles.fieldTableRow}>
            <td className={styles.fieldTableCell}>
              <span className={styles.fieldName}>{prop.name}</span>
            </td>
            <td className={styles.fieldTableCell}>
              <span className={styles.fieldType}>{prop.value}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
