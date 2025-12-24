'use client'

import type {
  LexObject,
  LexUserType,
  LexXrpcQuery,
  LexXrpcProcedure,
  LexXrpcSubscription,
} from '@atproto/lexicon'
import { useState } from 'react'
import styles from './SchemaDefinition.module.css'

export interface SchemaDefinitionProps {
  name: string
  def: LexUserType
}

export function SchemaDefinition({ name, def }: SchemaDefinitionProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'json'>('fields')
  const category = getTypeCategory(def)
  const fieldsTabLabel =
    category === 'scalar' || category === 'token' ? 'TYPE INFO' : 'DATA FIELDS'

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
    case 'object':
      return <ObjectTypeView def={def} />
    case 'query':
      return <QueryTypeView def={def} />
    case 'procedure':
      return <ProcedureTypeView def={def} />
    case 'subscription':
      return <SubscriptionTypeView def={def} />
    case 'scalar':
      return <ScalarTypeView def={def} />
    case 'token':
      return <TokenTypeView def={def} />
  }
}

function ObjectTypeView({ def }: ViewProps) {
  const fields = extractFields(def)

  if (fields.length === 0) {
    return (
      <div className={styles.noFields}>
        No data fields available for this type.
      </div>
    )
  }

  return <FieldTable fields={fields} />
}

function QueryTypeView({ def }: ViewProps) {
  if (def.type !== 'query') return null
  const query = def as LexXrpcQuery

  const paramFields = extractParamFields(query.parameters)
  const outputFields = extractBodyFields(query.output)

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

function ProcedureTypeView({ def }: ViewProps) {
  if (def.type !== 'procedure') return null
  const procedure = def as LexXrpcProcedure

  const paramFields = extractParamFields(procedure.parameters)
  const inputFields = extractBodyFields(procedure.input)
  const outputFields = extractBodyFields(procedure.output)

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

function SubscriptionTypeView({ def }: ViewProps) {
  if (def.type !== 'subscription') return null
  const subscription = def as LexXrpcSubscription

  const paramFields = extractParamFields(subscription.parameters)

  if (paramFields.length === 0) {
    return <div className={styles.noFields}>No data fields available.</div>
  }

  return (
    <div className={styles.fieldSections}>
      <FieldSection title="Parameters" fields={paramFields} />
    </div>
  )
}

interface FieldSectionProps {
  title: string
  fields: FieldInfo[]
}

function FieldSection({ title, fields }: FieldSectionProps) {
  if (fields.length === 0) return null

  return (
    <section className={styles.fieldSection}>
      <h4 className={styles.fieldSectionTitle}>{title}</h4>
      <FieldTable fields={fields} />
    </section>
  )
}

interface FieldTableProps {
  fields: FieldInfo[]
}

function FieldTable({ fields }: FieldTableProps) {
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
              <code className={styles.fieldName}>
                {field.name}
                {field.required && (
                  <span className={styles.fieldRequired}>*</span>
                )}
              </code>
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
              <code className={styles.fieldName}>{prop.name}</code>
            </td>
            <td className={styles.fieldTableCell}>
              <code className={styles.fieldType}>{prop.value}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface ScalarProperty {
  name: string
  value: string
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

function compactProperties(
  ...items: (ScalarProperty | null)[]
): ScalarProperty[] {
  return items.filter((x): x is ScalarProperty => x !== null)
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
    case 'permission-set':
      return compactProperties(property('type', 'permission-set'))
    default:
      return compactProperties(property('type', def.type))
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
type TypeCategory =
  | 'object'
  | 'query'
  | 'procedure'
  | 'subscription'
  | 'scalar'
  | 'token'

function getTypeCategory(def: LexUserType): TypeCategory {
  switch (def.type) {
    // Object-like types - have properties
    case 'object':
    case 'record':
      return 'object'

    // API types - have params/input/output sections
    case 'query':
      return 'query'
    case 'procedure':
      return 'procedure'
    case 'subscription':
      return 'subscription'

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
        ...extractBodyFields(def.output),
      ]

    case 'procedure':
      return [
        ...extractParamFields(def.parameters),
        ...extractBodyFields(def.input),
        ...extractBodyFields(def.output),
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
    name,
    type: getTypeString(prop),
    description: prop.description,
    required: requiredSet.has(name),
    nullable: false,
    constraints: getConstraints(prop),
  }))
}

function extractBodyFields(body: LexBody | undefined): FieldInfo[] {
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
    name,
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
        constraint('Default', prop.default, JSON.stringify),
        constraint('Const', prop.const, JSON.stringify),
        constraint('Enum', prop.enum, join),
        constraint('Known values', prop.knownValues, join),
        constraint('Min length', prop.minLength),
        constraint('Max length', prop.maxLength),
        constraint('Min graphemes', prop.minGraphemes),
        constraint('Max graphemes', prop.maxGraphemes),
      )
    case 'integer':
      return compact(
        constraint('Default', prop.default, JSON.stringify),
        constraint('Const', prop.const, JSON.stringify),
        constraint('Enum', prop.enum, join),
        constraint('Min', prop.minimum),
        constraint('Max', prop.maximum),
      )
    case 'boolean':
      return compact(
        constraint('Default', prop.default, JSON.stringify),
        constraint('Const', prop.const, JSON.stringify),
      )
    case 'array':
      return compact(
        constraint('Min length', prop.minLength),
        constraint('Max length', prop.maxLength),
      )
    case 'blob':
      return compact(
        constraint('Accept', prop.accept, join),
        constraint('Max size', prop.maxSize),
      )
    case 'bytes':
      return compact(
        constraint('Min length', prop.minLength),
        constraint('Max length', prop.maxLength),
      )
    case 'ref':
      return compact(constraint('Reference', prop.ref))
    case 'union':
      return compact(constraint('Refs', prop.refs, join))
    case 'cid-link':
    case 'unknown':
      return []
  }
}
