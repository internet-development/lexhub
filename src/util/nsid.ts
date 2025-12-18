/**
 * NSID and namespace prefix utilities
 *
 * ATProto NSID rules (from https://atproto.com/specs/nsid):
 * - NSIDs require 3+ segments (e.g., com.example.fooBar)
 * - Domain authority requires 2+ segments (e.g., com.example)
 * - Domain authority follows handle/DNS rules (lowercase, alphanumeric + hyphens)
 * - Name segment is camelCase (alphanumeric only, no hyphens)
 */

/** Minimum segments for a valid namespace prefix (domain authority) */
export const MIN_NAMESPACE_SEGMENTS = 2

const DOMAIN_SEGMENT_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

/**
 * Validates a namespace prefix (2+ segments following domain authority rules).
 * This is NOT a full NSID - use @atproto/syntax isValidNsid for that.
 *
 * @example
 * isValidNamespacePrefix('app.bsky') // true
 * isValidNamespacePrefix('com.example') // true
 * isValidNamespacePrefix('app') // false (only 1 segment)
 */
export function isValidNamespacePrefix(prefix: string): boolean {
  if (!prefix) return false
  if (prefix.length > 253) return false

  const segments = prefix.split('.')
  if (segments.length < MIN_NAMESPACE_SEGMENTS) return false

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment.length === 0 || segment.length > 63) return false
    if (!DOMAIN_SEGMENT_REGEX.test(segment)) return false
    if (i === 0 && /^[0-9]/.test(segment)) return false
  }

  return true
}

/**
 * Gets the parent namespace path, or null if already at root namespace.
 * Root namespaces have exactly MIN_NAMESPACE_SEGMENTS (2) segments.
 *
 * @example
 * getParentPath('app.bsky.feed.post') // 'app.bsky.feed'
 * getParentPath('app.bsky.feed') // 'app.bsky'
 * getParentPath('app.bsky') // null (root namespace)
 */
export function getParentPath(path: string): string | null {
  const segments = path.split('.')
  if (segments.length <= MIN_NAMESPACE_SEGMENTS) return null
  return segments.slice(0, -1).join('.')
}
