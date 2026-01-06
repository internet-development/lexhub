import { useEffect, useState } from 'react'

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export type UseSearchSuggestionsResult = {
  suggestions: string[]
  isLoading: boolean
  error: string | null
}

export function useSearchSuggestions(
  query: string,
  options: {
    enabled: boolean
    limit?: number
    debounceMs?: number
  },
): UseSearchSuggestionsResult {
  const { enabled, limit = 20, debounceMs = 200 } = options

  const debounced = useDebouncedValue(query.trim(), debounceMs)

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !debounced) {
      setSuggestions([])
      setIsLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetch(
      `/api/search/suggest?type=nsid&query=${encodeURIComponent(debounced)}&limit=${limit}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`)
        return res.json()
      })
      .then((json) => {
        setSuggestions(json.data)
        setIsLoading(false)
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : 'Failed to load suggestions')
        setSuggestions([])
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [debounced, enabled, limit])

  return { suggestions, isLoading, error }
}
