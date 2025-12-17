import { useEffect, useMemo, useRef, useState } from 'react'

type SuggestResponse = {
  data: string[]
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export type UseSearchSuggestionsStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

export type UseSearchSuggestionsResult = {
  query: string
  suggestions: string[]
  error: string | null
  isFetching: boolean
  showSpinner: boolean
  status: UseSearchSuggestionsStatus
}

export function useSearchSuggestions(
  query: string,
  options: {
    enabled: boolean
    limit?: number
    debounceMs?: number
    spinnerDelayMs?: number
  },
): UseSearchSuggestionsResult {
  const {
    enabled,
    limit = 20,
    debounceMs = 200,
    spinnerDelayMs = 200,
  } = options

  const normalized = useMemo(() => query.trim(), [query])
  const debounced = useDebouncedValue(normalized, debounceMs)

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [showSpinner, setShowSpinner] = useState(false)

  const requestIdRef = useRef(0)

  const [status, setStatus] = useState<UseSearchSuggestionsStatus>('idle')

  useEffect(() => {
    requestIdRef.current++

    if (!enabled || !normalized) {
      setSuggestions([])
      setError(null)
      setIsFetching(false)
      setShowSpinner(false)
      setStatus('idle')
      return
    }

    setSuggestions([])
    setError(null)
    setIsFetching(false)
    setShowSpinner(false)
    setStatus('idle')
  }, [enabled, normalized])

  useEffect(() => {
    if (!enabled || !debounced) return

    const requestId = ++requestIdRef.current

    setIsFetching(true)
    setShowSpinner(false)
    setError(null)
    setStatus('loading')

    const controller = new AbortController()

    const spinnerTimer = setTimeout(() => {
      if (requestId !== requestIdRef.current) return
      setShowSpinner(true)
    }, spinnerDelayMs)

    fetch(
      `/api/search/suggest?type=nsid&prefix=${encodeURIComponent(debounced)}&limit=${limit}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed with ${res.status}`)
        }
        return (await res.json()) as SuggestResponse
      })
      .then((json) => {
        if (requestId !== requestIdRef.current) return
        setSuggestions(json.data)
        setStatus('success')
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        if (requestId !== requestIdRef.current) return
        setSuggestions([])
        setError(e instanceof Error ? e.message : 'Failed to load suggestions')
        setStatus('error')
      })
      .finally(() => {
        clearTimeout(spinnerTimer)
        if (requestId !== requestIdRef.current) return
        setIsFetching(false)
        setShowSpinner(false)
      })

    return () => {
      clearTimeout(spinnerTimer)
      controller.abort()
    }
  }, [debounced, enabled, limit, spinnerDelayMs])

  return {
    query: debounced,
    suggestions,
    error,
    isFetching,
    showSpinner,
    status,
  }
}
