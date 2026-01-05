import type { FieldInfo } from './utils/types'
import { TypeDisplay } from './TypeDisplay'
import styles from './SchemaDefinition.module.css'

interface FieldTableProps {
  fields: FieldInfo[]
}

export function FieldTable({ fields }: FieldTableProps) {
  return (
    <table className={styles.fieldTable}>
      <thead>
        <tr>
          <th className={styles.fieldTableHead}>Name</th>
          <th className={styles.fieldTableHead}>Type</th>
          <th className={styles.fieldTableHead}>Details</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field.name} className={styles.fieldTableRow}>
            <td className={styles.fieldTableCell}>
              <span className={styles.fieldName}>
                {field.name}
                {field.required && (
                  <span className={styles.fieldRequired}>*</span>
                )}
              </span>
              {field.nullable && (
                <span className={styles.fieldNullable}>nullable</span>
              )}
            </td>
            <td className={styles.fieldTableCell}>
              <span className={styles.fieldType}>
                <TypeDisplay prop={field.prop} />
              </span>
            </td>
            <td className={styles.fieldTableCell}>
              {field.description && (
                <p className={styles.fieldDescription}>{field.description}</p>
              )}
              {field.constraints.length > 0 && (
                <ul className={styles.fieldConstraints}>
                  {field.constraints.map((c, i) => (
                    <li key={i} className={styles.fieldConstraint}>
                      {c.label}: {c.value}
                    </li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface FieldSectionProps {
  title: string
  fields: FieldInfo[]
}

export function FieldSection({ title, fields }: FieldSectionProps) {
  if (fields.length === 0) return null

  return (
    <section className={styles.fieldSection}>
      <h4 className={styles.fieldSectionTitle}>{title}</h4>
      <FieldTable fields={fields} />
    </section>
  )
}
