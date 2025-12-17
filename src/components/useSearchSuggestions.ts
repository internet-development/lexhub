import { useEffect, useRef, useState } from 'react'

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

  const normalized = query.trim()
  const debounced = useDebouncedValue(normalized, debounceMs)

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showSpinner, setShowSpinner] = useState(false)

  const controllerRef = useRef<AbortController | null>(null)

  const [status, setStatus] = useState<UseSearchSuggestionsStatus>('idle')

  const reset = () => {
    controllerRef.current?.abort()
    controllerRef.current = null

    setSuggestions([])
    setError(null)
    setShowSpinner(false)
    setStatus('idle')
  }

  useEffect(() => {
    reset()

    if (!enabled || !normalized) return

    setStatus('loading')
  }, [enabled, normalized])

  useEffect(() => {
    if (!enabled || !normalized || !debounced) return

    const controller = new AbortController()
    controllerRef.current?.abort()
    controllerRef.current = controller

    setShowSpinner(false)
    setError(null)
    setStatus('loading')

    const spinnerTimer = setTimeout(() => {
      if (controller.signal.aborted) return
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
        if (controller.signal.aborted) return
        setSuggestions(json.data)
        setStatus('success')
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        setSuggestions([])
        setError(e instanceof Error ? e.message : 'Failed to load suggestions')
        setStatus('error')
      })
      .finally(() => {
        clearTimeout(spinnerTimer)
        if (controller.signal.aborted) return
        setShowSpinner(false)
        controllerRef.current = null
      })

    return () => {
      clearTimeout(spinnerTimer)
      controller.abort()
    }
  }, [debounced, enabled, limit, normalized, spinnerDelayMs])

  return {
    query: debounced,
    suggestions,
    error,
    showSpinner,
    status,
  }
}
