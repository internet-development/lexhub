import type { LexObject } from '@atproto/lexicon'

export type LexProperty = LexObject['properties'][string]

export interface FieldInfo {
  name: string
  prop: LexProperty
  description?: string
  required: boolean
  nullable: boolean
  constraints: FieldConstraint[]
}

export interface FieldConstraint {
  label: string
  value: string
}

export type TypeCategory =
  | 'object'
  | 'query'
  | 'procedure'
  | 'subscription'
  | 'scalar'
  | 'token'
  | 'permission-set'
