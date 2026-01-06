import type {
  LexObject,
  LexXrpcBody,
  LexXrpcParameters,
} from '@atproto/lexicon'
import type { FieldInfo } from './types'
import { getConstraints } from './constraints'

export function extractObjectFields(
  properties: LexObject['properties'] | undefined,
  required: string[] | undefined,
  nullable: string[] | undefined,
): FieldInfo[] {
  if (!properties) return []

  const requiredSet = new Set(required ?? [])
  const nullableSet = new Set(nullable ?? [])

  return Object.entries(properties).map(([name, prop]) => ({
    name,
    prop,
    description: prop.description,
    required: requiredSet.has(name),
    nullable: nullableSet.has(name),
    constraints: getConstraints(prop),
  }))
}

export function extractParamFields(
  params: LexXrpcParameters | undefined,
): FieldInfo[] {
  if (!params?.properties) return []

  const requiredSet = new Set(params.required ?? [])

  return Object.entries(params.properties).map(([name, prop]) => ({
    name,
    prop,
    description: prop.description,
    required: requiredSet.has(name),
    nullable: false,
    constraints: getConstraints(prop),
  }))
}

export function extractBodyFields(body: LexXrpcBody | undefined): FieldInfo[] {
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
    prop,
    description: prop.description,
    required: requiredSet.has(name),
    nullable: nullableSet.has(name),
    constraints: getConstraints(prop),
  }))
}
