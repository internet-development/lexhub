'use client'

import clsx from '@/util/clsx'
import styles from './Search.module.css'
import { useSearchSuggestions } from './useSearchSuggestions'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'

import { useEffect, useId, useReducer, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

type State = {
  isOpen: boolean
  activeIndex: number
}

type Action =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'resetActive' }
  | { type: 'setActive'; index: number }
  | { type: 'moveActive'; delta: 1 | -1; itemCount: number }

const initialState: State = {
  isOpen: false,
  activeIndex: -1,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'open':
      return { ...state, isOpen: true }
    case 'close':
      return { isOpen: false, activeIndex: -1 }
    case 'resetActive':
      return { ...state, activeIndex: -1 }
    case 'setActive':
      return { ...state, activeIndex: action.index }
    case 'moveActive': {
      if (action.itemCount <= 0) return state
      const nextBase =
        state.activeIndex < 0
          ? action.delta === 1
            ? 0
            : action.itemCount - 1
          : state.activeIndex + action.delta
      const next = Math.max(0, Math.min(nextBase, action.itemCount - 1))
      return { ...state, activeIndex: next, isOpen: true }
    }
  }
}

export interface SearchProps {
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  buttonText?: string
  alwaysActive?: boolean
}

export default function Search(props: SearchProps) {
  const {
    onChange,
    onSearch,
    placeholder = 'Search Lexicons, Namespaces...',
    buttonText = 'Search',
    alwaysActive = false,
  } = props

  const router = useRouter()

  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [state, dispatch] = useReducer(reducer, initialState)
  const close = () => dispatch({ type: 'close' })
  const open = () => dispatch({ type: 'open' })

  useEffect(() => {
    dispatch({ type: 'resetActive' })
  }, [value])

  const handleChange = (next: string) => {
    setValue(next)
    onChange?.(next)
  }

  const handleSearch = () => {
    if (onSearch) {
      onSearch(value)
    } else if (value.trim()) {
      router.push(`/${value.trim()}`)
    }
  }

  const { suggestions, isLoading, error } = useSearchSuggestions(value, {
    enabled: state.isOpen,
    limit: 20,
  })

  const commitSelection = (next: string) => {
    handleChange(next)
    close()
    inputRef.current?.focus()
  }

  const inputHasValue = value.trim().length > 0
  const showPopup = state.isOpen && inputHasValue
  const isActive = alwaysActive || isFocused || inputHasValue
  const showLoading = isActive && isLoading && inputHasValue

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
        if (
          showPopup &&
          state.activeIndex >= 0 &&
          state.activeIndex < suggestions.length
        ) {
          commitSelection(suggestions[state.activeIndex])
          return
        }
        e.preventDefault()
        close()
        handleSearch()
        return
      case 'Escape':
        close()
        return
      case 'ArrowDown':
        e.preventDefault()
        dispatch({
          type: 'moveActive',
          delta: 1,
          itemCount: suggestions.length,
        })
        return
      case 'ArrowUp':
        e.preventDefault()
        dispatch({
          type: 'moveActive',
          delta: -1,
          itemCount: suggestions.length,
        })
        return
    }
  }

  return (
    <form
      className={styles.container}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        close()
        handleSearch()
      }}
    >
      <div
        className={clsx(
          styles.wrapper,
          showPopup && styles.wrapperOpen,
          isActive && styles.wrapperActive,
        )}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={showPopup}
          aria-controls={listboxId}
          aria-activedescendant={
            showPopup && state.activeIndex >= 0
              ? `${listboxId}-${state.activeIndex}`
              : undefined
          }
          onChange={(e) => {
            handleChange(e.target.value)
            open()
          }}
          onFocus={() => {
            setIsFocused(true)
            open()
          }}
          onBlur={() => {
            setIsFocused(false)
            close()
          }}
          onKeyDown={handleKeyDown}
          className={styles.input}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className={clsx(styles.button, !isActive && styles.buttonInactive)}
          type="submit"
        >
          {showLoading ? <Spinner size={16} /> : buttonText}
        </button>
      </div>

      {showPopup && (
        <div className={styles.suggestions} role="listbox" id={listboxId}>
          {error && <div className={styles.statusRow}>{error}</div>}

          {!error && isLoading && suggestions.length === 0 && (
            <div className={styles.statusRow}>Loading...</div>
          )}

          {!error && !isLoading && suggestions.length === 0 && (
            <div className={styles.statusRow}>No matches</div>
          )}

          {suggestions.map((item, index) => (
            <button
              id={`${listboxId}-${index}`}
              key={item}
              type="button"
              tabIndex={-1}
              className={clsx(
                styles.suggestion,
                index === state.activeIndex && styles.suggestionActive,
              )}
              onMouseEnter={() => dispatch({ type: 'setActive', index })}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commitSelection(item)}
              role="option"
              aria-selected={index === state.activeIndex}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
