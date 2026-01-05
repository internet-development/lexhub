import type { FieldConstraint, LexProperty } from './types'

/** Format a text constraint, or return null if value is undefined */
export function constraint(
  label: string,
  value: unknown,
  format: (v: never) => string = String,
): FieldConstraint | null {
  if (value === undefined) return null
  return { label, value: format(value as never) }
}

/** Filter out null values from constraint list */
export function compactConstraints(
  ...items: (FieldConstraint | null)[]
): FieldConstraint[] {
  return items.filter((x): x is FieldConstraint => x !== null)
}

export function join(v: string[]) {
  return v.join(', ')
}

export function getConstraints(prop: LexProperty): FieldConstraint[] {
  switch (prop.type) {
    case 'string':
      return compactConstraints(
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
      return compactConstraints(
        constraint('Default', prop.default, JSON.stringify),
        constraint('Const', prop.const, JSON.stringify),
        constraint('Enum', prop.enum, join),
        constraint('Min', prop.minimum),
        constraint('Max', prop.maximum),
      )
    case 'boolean':
      return compactConstraints(
        constraint('Default', prop.default, JSON.stringify),
        constraint('Const', prop.const, JSON.stringify),
      )
    case 'array':
      return compactConstraints(
        constraint('Min length', prop.minLength),
        constraint('Max length', prop.maxLength),
      )
    case 'blob':
      return compactConstraints(
        constraint('Accept', prop.accept, join),
        constraint('Max size', prop.maxSize),
      )
    case 'bytes':
      return compactConstraints(
        constraint('Min length', prop.minLength),
        constraint('Max length', prop.maxLength),
      )
    case 'ref':
    case 'union':
    case 'cid-link':
    case 'unknown':
      return []
  }
}
