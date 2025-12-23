'use client'

import { useState } from 'react'
import type { LexUserType, LexObject } from '@atproto/lexicon'
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

/** Property type for object/record fields - derived from LexObject */
type LexProperty = LexObject['properties'][string]

function extractFields(def: LexUserType): FieldInfo[] {
  const fields: FieldInfo[] = []

  // Handle object type
  if (def.type === 'object' && def.properties) {
    const required = new Set(def.required ?? [])
    const nullable = new Set(def.nullable ?? [])

    for (const [name, prop] of Object.entries(def.properties)) {
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
  if (def.type === 'record' && def.record.properties) {
    const required = new Set(def.record.required ?? [])
    const nullable = new Set(def.record.nullable ?? [])

    for (const [name, prop] of Object.entries(def.record.properties)) {
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

  // Handle query/procedure parameters
  if ((def.type === 'query' || def.type === 'procedure') && def.parameters) {
    if (def.parameters.properties) {
      const required = new Set(def.parameters.required ?? [])

      for (const [name, prop] of Object.entries(def.parameters.properties)) {
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

function getTypeString(prop: LexProperty): string {
  switch (prop.type) {
    case 'array':
      return `array<${getTypeString(prop.items)}>`
    case 'ref':
      return `ref(${prop.ref})`
    case 'union':
      return `union[${prop.refs.length}]`
    case 'string':
      return prop.format ? `string (${prop.format})` : 'string'
    default:
      return prop.type
  }
}

/** Format a constraint as "label: value", or return null if value is undefined */
function constraint(
  label: string,
  value: unknown,
  format: (v: never) => string = String,
): string | null {
  if (value === undefined) return null
  return `${label}: ${format(value as never)}`
}

/** Filter out null values from constraint list */
function compact(...items: (string | null)[]): string[] {
  return items.filter((x): x is string => x !== null)
}

function join(v: string[]) {
  return v.join(', ')
}

function getConstraints(prop: LexProperty): string[] {
  switch (prop.type) {
    case 'string':
      return compact(
        constraint('default', prop.default, JSON.stringify),
        constraint('const', prop.const, JSON.stringify),
        constraint('enum', prop.enum, join),
        constraint('known values', prop.knownValues, join),
        constraint('minLength', prop.minLength),
        constraint('maxLength', prop.maxLength),
        constraint('minGraphemes', prop.minGraphemes),
        constraint('maxGraphemes', prop.maxGraphemes),
      )
    case 'integer':
      return compact(
        constraint('default', prop.default, JSON.stringify),
        constraint('const', prop.const, JSON.stringify),
        constraint('enum', prop.enum, join),
        constraint('min', prop.minimum),
        constraint('max', prop.maximum),
      )
    case 'boolean':
      return compact(
        constraint('default', prop.default, JSON.stringify),
        constraint('const', prop.const, JSON.stringify),
      )
    case 'array':
      return compact(
        constraint('minLength', prop.minLength),
        constraint('maxLength', prop.maxLength),
      )
    case 'blob':
      return compact(
        constraint('accept', prop.accept, join),
        constraint('maxSize', prop.maxSize),
      )
    case 'bytes':
      return compact(
        constraint('minLength', prop.minLength),
        constraint('maxLength', prop.maxLength),
      )
    case 'ref':
      return compact(constraint('ref', prop.ref))
    case 'union':
      return compact(constraint('refs', prop.refs, join))
    case 'cid-link':
    case 'unknown':
      return []
  }
}
