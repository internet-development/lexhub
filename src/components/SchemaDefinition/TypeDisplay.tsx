import type { LexProperty } from './utils/types'
import styles from './SchemaDefinition.module.css'

/**
 * Converts a lexicon ref to a URL path.
 * @example "app.bsky.actor.defs#profileView" -> "/app.bsky.actor.defs#profileView"
 * @example "#profileView" -> "#profileView" (same-lexicon ref)
 */
function refToHref(ref: string): string {
  if (ref.startsWith('#')) {
    return ref
  }
  const [nsid, fragment] = ref.split('#')
  return fragment ? `/${nsid}#${fragment}` : `/${nsid}`
}

export function TypeDisplay({ prop }: { prop: LexProperty }) {
  switch (prop.type) {
    case 'array':
      return (
        <>
          array&lt;
          <TypeDisplay prop={prop.items} />
          &gt;
        </>
      )
    case 'ref':
      return (
        <>
          ref(
          <a href={refToHref(prop.ref)} className={styles.fieldRefLink}>
            {prop.ref}
          </a>
          )
        </>
      )
    case 'union':
      return <>union[{prop.refs.length}]</>
    case 'string':
      return <>{prop.format ? `string (${prop.format})` : 'string'}</>
    default:
      return <>{prop.type}</>
  }
}

export function getTypeString(prop: LexProperty): string {
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
