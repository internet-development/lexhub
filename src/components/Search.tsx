import clsx from '@/common/clsx'
import styles from '@/components/Search.module.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

export interface SearchProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  placeholder?: string
  buttonText?: string
}

type SuggestResponse = {
  data: string[]
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export default function Search(props: SearchProps) {
  const {
    value,
    onChange,
    onSearch,
    placeholder = 'Search...',
    buttonText = 'Search',
  } = props

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const requestIdRef = useRef(0)

  const debouncedValue = useDebouncedValue(value.trim(), 200)

  const showSuggestions =
    open &&
    (loading || suggestions.length > 0 || !!error || debouncedValue.length > 0)

  const suggestionItems = useMemo(() => suggestions, [suggestions])

  useEffect(() => {
    // reset selection whenever query changes
    setActiveIndex(-1)

    if (!open) {
      setLoading(false)
      return
    }

    if (!debouncedValue) {
      setSuggestions([])
      setLoading(false)
      setError(null)
      return
    }

    const requestId = ++requestIdRef.current

    setLoading(true)
    setError(null)

    const controller = new AbortController()

    fetch(
      `/api/search/suggest?type=nsid&prefix=${encodeURIComponent(debouncedValue)}&limit=20`,
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
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        if (requestId !== requestIdRef.current) return
        setSuggestions([])
        setError(e instanceof Error ? e.message : 'Failed to load suggestions')
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return
        setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedValue, open])

  function handleSubmit() {
    setOpen(false)
    onSearch()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && activeIndex < suggestionItems.length) {
        const next = suggestionItems[activeIndex]
        onChange(next)
        setOpen(false)
        return
      }

      e.preventDefault()
      handleSubmit()
      return
    }

    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }

    if (!open) return

    if (e.key === 'Escape') {
      setOpen(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (suggestionItems.length === 0) return
      setActiveIndex((idx) => {
        const nextIndex = Math.min(idx + 1, suggestionItems.length - 1)
        return nextIndex
      })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestionItems.length === 0) return
      setActiveIndex((idx) => {
        const nextIndex = Math.max(idx - 1, 0)
        return nextIndex
      })
      return
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={clsx(styles.wrapper, showSuggestions && styles.wrapperOpen)}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Allow click selection to register before closing.
            setTimeout(() => setOpen(false), 100)
          }}
          onKeyDown={handleKeyDown}
          className={styles.input}
          autoComplete="off"
          spellCheck={false}
        />
        <button className={styles.button} onClick={handleSubmit}>
          {buttonText}
        </button>
      </div>

      {showSuggestions ? (
        <div className={styles.suggestions} role="listbox">
          {error ? <div className={styles.statusRow}>{error}</div> : null}
          {loading ? <div className={styles.statusRow}>Loading...</div> : null}
          {!loading && !error && suggestionItems.length === 0 ? (
            <div className={styles.statusRow}>No matches</div>
          ) : null}

          {suggestionItems.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`${styles.suggestion} ${index === activeIndex ? styles.suggestionActive : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(item)
                setSuggestions([])
                setOpen(false)
                inputRef.current?.focus()
              }}
              role="option"
              aria-selected={index === activeIndex}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
