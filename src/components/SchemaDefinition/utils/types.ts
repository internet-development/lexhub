import type { LexObject } from '@atproto/lexicon'

/** Property type for object/record fields - derived from LexObject */
export type LexProperty = LexObject['properties'][string]

export interface FieldInfo {
  name: string
  prop: LexProperty
  description?: string
  required: boolean
  nullable: boolean
  constraints: FieldConstraint[]
}

/** A constraint is a label-value pair */
export interface FieldConstraint {
  label: string
  value: string
}

/** Categories of lexicon types for determining which view to render */
export type TypeCategory =
  | 'object'
  | 'query'
  | 'procedure'
  | 'subscription'
  | 'scalar'
  | 'token'
  | 'permission-set'
