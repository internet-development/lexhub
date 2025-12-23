'use client'

import { useState } from 'react'
import type { LexUserType } from '@atproto/lexicon'
import styles from './SchemaDefinition.module.css'

export interface SchemaDefinitionProps {
  name: string
  def: LexUserType
}

export function SchemaDefinition({ name, def }: SchemaDefinitionProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'json'>('fields')

  return (
    <li className={styles.defItem} id={name}>
      <details className={styles.defDetails}>
        <summary className={styles.defHeader}>
          <span className={styles.defName}>{name}</span>
          <div className={styles.defHeaderRight}>
            <span className={styles.defType}>{def.type.toUpperCase()}</span>
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
          {def.description && (
            <div className={styles.defDescriptionSection}>
              <span className={styles.defDescriptionLabel}>DESCRIPTION</span>
              <p className={styles.defDescription}>{def.description}</p>
            </div>
          )}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'fields' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('fields')}
            >
              DATA FIELDS
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'json' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('json')}
            >
              JSON
            </button>
          </div>
          {activeTab === 'fields' ? (
            <NiceView def={def} />
          ) : (
            <JsonView def={def} />
          )}
        </div>
      </details>
    </li>
  )
}

interface ViewProps {
  def: LexUserType
}

function JsonView({ def }: ViewProps) {
  return <pre className={styles.schema}>{JSON.stringify(def, null, 2)}</pre>
}

function NiceView({ def }: ViewProps) {
  const fields = extractFields(def)

  if (fields.length === 0) {
    return (
      <div className={styles.noFields}>
        No data fields available for this type.
      </div>
    )
  }

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
              <code className={styles.fieldName}>{field.name}</code>
              {field.required && (
                <span className={styles.fieldRequired}>required</span>
              )}
              {field.nullable && (
                <span className={styles.fieldNullable}>nullable</span>
              )}
            </td>
            <td className={styles.fieldTableCell}>
              <code className={styles.fieldType}>{field.type}</code>
            </td>
            <td className={styles.fieldTableCell}>
              {field.description && (
                <p className={styles.fieldDescription}>{field.description}</p>
              )}
              {field.constraints.length > 0 && (
                <ul className={styles.fieldConstraints}>
                  {field.constraints.map((constraint, i) => (
                    <li key={i} className={styles.fieldConstraint}>
                      {constraint}
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

interface FieldInfo {
  name: string
  type: string
  description?: string
  required: boolean
  nullable: boolean
  constraints: string[]
}

// Use a looser type for property objects to avoid complex union type issues
type PropertyDef = Record<string, unknown> & {
  type?: string
  description?: string
}

function extractFields(def: LexUserType): FieldInfo[] {
  const fields: FieldInfo[] = []
  const defAny = def as Record<string, unknown>

  // Handle object type
  if (defAny.type === 'object' && defAny.properties) {
    const properties = defAny.properties as Record<string, PropertyDef>
    const required = new Set((defAny.required as string[]) ?? [])
    const nullable = new Set((defAny.nullable as string[]) ?? [])

    for (const [name, prop] of Object.entries(properties)) {
      fields.push({
        name,
        type: getTypeString(prop),
        description: prop.description,
        required: required.has(name),
        nullable: nullable.has(name),
        constraints: getConstraints(prop),
      })
    }
  }

  // Handle record type (has a nested record property with properties)
  if (defAny.type === 'record' && defAny.record) {
    const record = defAny.record as Record<string, unknown>
    const properties = record.properties as
      | Record<string, PropertyDef>
      | undefined
    if (properties) {
      const required = new Set((record.required as string[]) ?? [])
      const nullable = new Set((record.nullable as string[]) ?? [])

      for (const [name, prop] of Object.entries(properties)) {
        fields.push({
          name,
          type: getTypeString(prop),
          description: prop.description,
          required: required.has(name),
          nullable: nullable.has(name),
          constraints: getConstraints(prop),
        })
      }
    }
  }

  // Handle query/procedure parameters
  if (
    (defAny.type === 'query' || defAny.type === 'procedure') &&
    defAny.parameters
  ) {
    const params = defAny.parameters as Record<string, unknown>
    const properties = params.properties as
      | Record<string, PropertyDef>
      | undefined
    if (properties) {
      const required = new Set((params.required as string[]) ?? [])

      for (const [name, prop] of Object.entries(properties)) {
        fields.push({
          name: `param: ${name}`,
          type: getTypeString(prop),
          description: prop.description,
          required: required.has(name),
          nullable: false,
          constraints: getConstraints(prop),
        })
      }
    }
  }

  return fields
}

function getTypeString(prop: PropertyDef): string {
  if (!prop.type) return 'unknown'

  switch (prop.type) {
    case 'array': {
      const items = prop.items as PropertyDef | undefined
      if (items) {
        const itemType = getTypeString(items)
        return `array<${itemType}>`
      }
      return 'array'
    }
    case 'ref': {
      const ref = prop.ref as string | undefined
      return ref ? `ref(${ref})` : 'ref'
    }
    case 'union': {
      const refs = prop.refs as string[] | undefined
      return refs ? `union[${refs.length}]` : 'union'
    }
    case 'string': {
      const format = prop.format as string | undefined
      if (format) {
        return `string (${format})`
      }
      return 'string'
    }
    default:
      return prop.type
  }
}

function getConstraints(prop: PropertyDef): string[] {
  const constraints: string[] = []

  if (prop.default !== undefined) {
    constraints.push(`default: ${JSON.stringify(prop.default)}`)
  }
  if (prop.const !== undefined) {
    constraints.push(`const: ${JSON.stringify(prop.const)}`)
  }
  if (prop.enum && Array.isArray(prop.enum)) {
    constraints.push(`enum: ${prop.enum.join(', ')}`)
  }
  if (prop.knownValues && Array.isArray(prop.knownValues)) {
    constraints.push(`known values: ${prop.knownValues.join(', ')}`)
  }
  if (prop.minimum !== undefined) {
    constraints.push(`min: ${prop.minimum}`)
  }
  if (prop.maximum !== undefined) {
    constraints.push(`max: ${prop.maximum}`)
  }
  if (prop.minLength !== undefined) {
    constraints.push(`minLength: ${prop.minLength}`)
  }
  if (prop.maxLength !== undefined) {
    constraints.push(`maxLength: ${prop.maxLength}`)
  }
  if (prop.minGraphemes !== undefined) {
    constraints.push(`minGraphemes: ${prop.minGraphemes}`)
  }
  if (prop.maxGraphemes !== undefined) {
    constraints.push(`maxGraphemes: ${prop.maxGraphemes}`)
  }
  if (prop.ref) {
    constraints.push(`ref: ${prop.ref}`)
  }
  if (prop.refs && Array.isArray(prop.refs)) {
    constraints.push(`refs: ${prop.refs.join(', ')}`)
  }
  if (prop.accept && Array.isArray(prop.accept)) {
    constraints.push(`accept: ${prop.accept.join(', ')}`)
  }
  if (prop.maxSize !== undefined) {
    constraints.push(`maxSize: ${prop.maxSize}`)
  }

  return constraints
}
