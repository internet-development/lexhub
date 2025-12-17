/**
 * NSID and namespace prefix utilities
 *
 * ATProto NSID rules (from https://atproto.com/specs/nsid):
 * - NSIDs require 3+ segments (e.g., com.example.fooBar)
 * - Domain authority requires 2+ segments (e.g., com.example)
 * - Domain authority follows handle/DNS rules (lowercase, alphanumeric + hyphens)
 * - Name segment is camelCase (alphanumeric only, no hyphens)
 */

/**
 * Regex for validating a single domain authority segment
 * - 1-63 characters
 * - Alphanumeric and hyphens
 * - Cannot start or end with hyphen
 * - First segment (TLD) cannot start with digit
 */
const DOMAIN_SEGMENT_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

/**
 * Validates a namespace prefix (2+ segments following domain authority rules)
 * This is NOT a full NSID - use @atproto/syntax isValidNsid for that
 *
 * @example
 * isValidNamespacePrefix('app.bsky') // true
 * isValidNamespacePrefix('com.example') // true
 * isValidNamespacePrefix('app') // false (only 1 segment)
 * isValidNamespacePrefix('app.bsky.actor.defs') // true (valid as prefix, but is also valid NSID)
 */
export function isValidNamespacePrefix(prefix: string): boolean {
  if (!prefix || typeof prefix !== 'string') return false

  // Max length for domain authority is 253 chars
  if (prefix.length > 253) return false

  const segments = prefix.split('.')

  // Must have at least 2 segments
  if (segments.length < 2) return false

  // Validate each segment follows domain authority rules
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    // Each segment must be 1-63 chars
    if (segment.length === 0 || segment.length > 63) return false

    // Must match domain segment pattern
    if (!DOMAIN_SEGMENT_REGEX.test(segment)) return false

    // First segment (TLD when reversed) cannot start with digit
    if (i === 0 && /^[0-9]/.test(segment)) return false
  }

  return true
}

/**
 * Extracts parent prefix from an NSID or namespace path
 *
 * @example
 * getParentPrefix('app.bsky.actor') // 'app.bsky'
 * getParentPrefix('app.bsky') // null (would be single segment)
 * getParentPrefix('app.bsky.actor.defs') // 'app.bsky.actor'
 */
export function getParentPrefix(path: string): string | null {
  if (!path) return null

  const segments = path.split('.')
  if (segments.length <= 2) return null

  return segments.slice(0, -1).join('.')
}

/**
 * Gets the last segment of a path
 *
 * @example
 * getLastSegment('app.bsky.actor') // 'actor'
 * getLastSegment('app.bsky') // 'bsky'
 */
export function getLastSegment(path: string): string {
  if (!path) return ''

  const segments = path.split('.')
  return segments[segments.length - 1]
}

/**
 * Counts segments in a path
 *
 * @example
 * countSegments('app.bsky.actor') // 3
 * countSegments('app.bsky') // 2
 */
export function countSegments(path: string): number {
  if (!path) return 0
  return path.split('.').length
}

/**
 * Builds a full path from prefix and segment
 *
 * @example
 * buildPath('app.bsky', 'actor') // 'app.bsky.actor'
 */
export function buildPath(prefix: string, segment: string): string {
  return `${prefix}.${segment}`
}
