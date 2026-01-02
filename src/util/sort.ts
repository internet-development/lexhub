/** Comparator that puts "main" first, then sorts alphabetically */
export function compareDefNames(a: string, b: string): number {
  if (a === 'main') return -1
  if (b === 'main') return 1
  return a.localeCompare(b)
}
