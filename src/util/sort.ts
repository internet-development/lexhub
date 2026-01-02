/** Sorts def names with "main" first, then alphabetically */
export function sortDefNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    if (a === 'main') return -1
    if (b === 'main') return 1
    return a.localeCompare(b)
  })
}

/** Sorts def entries with "main" first, then alphabetically */
export function sortDefEntries<T>(entries: [string, T][]): [string, T][] {
  return [...entries].sort(([a], [b]) => {
    if (a === 'main') return -1
    if (b === 'main') return 1
    return a.localeCompare(b)
  })
}
