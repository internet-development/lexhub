'use client'

import type { LexObject, LexUserType } from '@atproto/lexicon'
import { useState } from 'react'
import styles from './SchemaDefinition.module.css'

export interface SchemaDefinitionProps {
  name: string
  def: LexUserType
}

export function SchemaDefinition({ name, def }: SchemaDefinitionProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'json'>('fields')
  const category = getTypeCategory(def)
  const fieldsTabLabel = category === 'structured' ? 'DATA FIELDS' : 'TYPE INFO'

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
              {fieldsTabLabel}
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
  const category = getTypeCategory(def)

  switch (category) {
    case 'structured':
      return <StructuredTypeView def={def} />
    case 'scalar':
      return <ScalarTypeView def={def} />
    case 'token':
      return <TokenTypeView def={def} />
  }
}

function StructuredTypeView({ def }: ViewProps) {
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
                  {field.constraints.map((c, i) => (
                    <li key={i} className={styles.fieldConstraint}>
                      {c}
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

function ScalarTypeView({ def }: ViewProps) {
  const typeInfo = getScalarTypeInfo(def)

  return (
    <dl className={styles.propertyList}>
      <div className={styles.propertyRow}>
        <dt className={styles.propertyLabel}>Type</dt>
        <dd className={styles.propertyValue}>
          <code>{typeInfo.type}</code>
        </dd>
      </div>
      {typeInfo.format && (
        <div className={styles.propertyRow}>
          <dt className={styles.propertyLabel}>Format</dt>
          <dd className={styles.propertyValue}>
            <code>{typeInfo.format}</code>
          </dd>
        </div>
      )}
      {typeInfo.constraints.length > 0 && (
        <div className={styles.propertyRow}>
          <dt className={styles.propertyLabel}>Constraints</dt>
          <dd className={styles.propertyValue}>
            <ul className={styles.constraintList}>
              {typeInfo.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </dd>
        </div>
      )}
      {typeInfo.itemType && (
        <div className={styles.propertyRow}>
          <dt className={styles.propertyLabel}>Items</dt>
          <dd className={styles.propertyValue}>
            <code>{typeInfo.itemType}</code>
          </dd>
        </div>
      )}
    </dl>
  )
}

interface ScalarTypeInfo {
  type: string
  format?: string
  constraints: string[]
  itemType?: string
}

function getScalarTypeInfo(def: LexUserType): ScalarTypeInfo {
  switch (def.type) {
    case 'string':
      return {
        type: 'string',
        format: def.format,
        constraints: compact(
          constraint('default', def.default, JSON.stringify),
          constraint('const', def.const, JSON.stringify),
          constraint('enum', def.enum, join),
          constraint('known values', def.knownValues, join),
          constraint('minLength', def.minLength),
          constraint('maxLength', def.maxLength),
          constraint('minGraphemes', def.minGraphemes),
          constraint('maxGraphemes', def.maxGraphemes),
        ),
      }
    case 'integer':
      return {
        type: 'integer',
        constraints: compact(
          constraint('default', def.default, JSON.stringify),
          constraint('const', def.const, JSON.stringify),
          constraint('enum', def.enum, join),
          constraint('min', def.minimum),
          constraint('max', def.maximum),
        ),
      }
    case 'boolean':
      return {
        type: 'boolean',
        constraints: compact(
          constraint('default', def.default, JSON.stringify),
          constraint('const', def.const, JSON.stringify),
        ),
      }
    case 'bytes':
      return {
        type: 'bytes',
        constraints: compact(
          constraint('minLength', def.minLength),
          constraint('maxLength', def.maxLength),
        ),
      }
    case 'blob':
      return {
        type: 'blob',
        constraints: compact(
          constraint('accept', def.accept, join),
          constraint('maxSize', def.maxSize),
        ),
      }
    case 'array':
      return {
        type: 'array',
        itemType: getTypeString(def.items),
        constraints: compact(
          constraint('minLength', def.minLength),
          constraint('maxLength', def.maxLength),
        ),
      }
    case 'cid-link':
      return { type: 'cid-link', constraints: [] }
    case 'unknown':
      return { type: 'unknown', constraints: [] }
    case 'permission-set':
      return { type: 'permission-set', constraints: [] }
    default:
      return { type: def.type, constraints: [] }
  }
}

function TokenTypeView({ def }: ViewProps) {
  return (
    <div className={styles.tokenMessage}>
      <p>
        This is a <strong>token</strong> type. Tokens are named constants used
        as identifiers or enum-like values in the AT Protocol.
      </p>
    </div>
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

/** Categories of lexicon types for determining which view to render */
type TypeCategory = 'structured' | 'scalar' | 'token'

function getTypeCategory(def: LexUserType): TypeCategory {
  switch (def.type) {
    // Structured types - have nested properties/fields
    case 'object':
    case 'record':
    case 'query':
    case 'procedure':
    case 'subscription':
      return 'structured'

    // Scalar/primitive types - just constraints, no nested structure
    case 'string':
    case 'integer':
    case 'boolean':
    case 'bytes':
    case 'blob':
    case 'cid-link':
    case 'unknown':
    case 'array':
    case 'permission-set':
      return 'scalar'

    // Token type - named constant marker
    case 'token':
      return 'token'
  }
}

function extractFields(def: LexUserType): FieldInfo[] {
  switch (def.type) {
    case 'object':
      return extractObjectFields(def.properties, def.required, def.nullable)

    case 'record':
      return extractObjectFields(
        def.record.properties,
        def.record.required,
        def.record.nullable,
      )

    case 'query':
      return [
        ...extractParamFields(def.parameters),
        ...extractBodyFields(def.output, 'output'),
      ]

    case 'procedure':
      return [
        ...extractParamFields(def.parameters),
        ...extractBodyFields(def.input, 'input'),
        ...extractBodyFields(def.output, 'output'),
      ]

    case 'subscription':
      return extractParamFields(def.parameters)

    default:
      return []
  }
}

function extractObjectFields(
  properties: LexObject['properties'] | undefined,
  required: string[] | undefined,
  nullable: string[] | undefined,
): FieldInfo[] {
  if (!properties) return []

  const requiredSet = new Set(required ?? [])
  const nullableSet = new Set(nullable ?? [])

  return Object.entries(properties).map(([name, prop]) => ({
    name,
    type: getTypeString(prop),
    description: prop.description,
    required: requiredSet.has(name),
    nullable: nullableSet.has(name),
    constraints: getConstraints(prop),
  }))
}

type LexParams = {
  properties?: Record<string, LexProperty>
  required?: string[]
}
type LexBody = {
  schema?:
    | {
        type: 'object'
        properties?: LexObject['properties']
        required?: string[]
        nullable?: string[]
      }
    | { type: 'ref' | 'union' }
}

function extractParamFields(params: LexParams | undefined): FieldInfo[] {
  if (!params?.properties) return []

  const requiredSet = new Set(params.required ?? [])

  return Object.entries(params.properties).map(([name, prop]) => ({
    name: `param: ${name}`,
    type: getTypeString(prop),
    description: prop.description,
    required: requiredSet.has(name),
    nullable: false,
    constraints: getConstraints(prop),
  }))
}

function extractBodyFields(
  body: LexBody | undefined,
  prefix: 'input' | 'output',
): FieldInfo[] {
  if (
    !body?.schema ||
    body.schema.type !== 'object' ||
    !body.schema.properties
  ) {
    return []
  }

  const requiredSet = new Set(body.schema.required ?? [])
  const nullableSet = new Set(body.schema.nullable ?? [])

  return Object.entries(body.schema.properties).map(([name, prop]) => ({
    name: `${prefix}: ${name}`,
    type: getTypeString(prop),
    description: prop.description,
    required: requiredSet.has(name),
    nullable: nullableSet.has(name),
    constraints: getConstraints(prop),
  }))
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
