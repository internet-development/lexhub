import clsx from '@/common/clsx'
import styles from '@/components/Search.module.css'
import { useSearchSuggestions } from '@/components/useSearchSuggestions'

import { useEffect, useId, useReducer, useRef } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'

export interface SearchProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  placeholder?: string
  buttonText?: string
}

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
    case 'open': {
      return { ...state, isOpen: true }
    }
    case 'close': {
      return { isOpen: false, activeIndex: -1 }
    }
    case 'resetActive': {
      return { ...state, activeIndex: -1 }
    }
    case 'setActive': {
      return { ...state, activeIndex: action.index }
    }
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

export default function Search(props: SearchProps) {
  const {
    value,
    onChange,
    onSearch,
    placeholder = 'Search...',
    buttonText = 'Search',
  } = props

  const [state, dispatch] = useReducer(reducer, initialState)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const { suggestions, error, isFetching, showSpinner } = useSearchSuggestions(
    value,
    { enabled: state.isOpen, limit: 20 },
  )

  useEffect(() => {
    dispatch({ type: 'resetActive' })
  }, [value])

  const inputHasValue = value.trim().length > 0

  const shouldShowPopup = () =>
    state.isOpen &&
    (showSpinner || suggestions.length > 0 || !!error || inputHasValue)

  const showPopup = shouldShowPopup()

  const listboxId = useId()

  const close = () => {
    dispatch({ type: 'close' })
  }

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!state.isOpen) return

    const handlePointerDown = (e: PointerEvent) => {
      const wrapper = wrapperRef.current
      if (!wrapper) return
      if (e.target instanceof Node && wrapper.contains(e.target)) return
      close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [state.isOpen])

  const commitSelection = (next: string) => {
    onChange(next)
    close()
    inputRef.current?.focus()
  }

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    if (!state.isOpen) return
    const next = e.relatedTarget
    if (next instanceof Node && wrapperRef.current?.contains(next)) return
    close()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter': {
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
        onSearch()
        return
      }
      case 'Escape': {
        close()
        return
      }
      case 'ArrowDown': {
        e.preventDefault()
        dispatch({
          type: 'moveActive',
          delta: 1,
          itemCount: suggestions.length,
        })
        return
      }
      case 'ArrowUp': {
        e.preventDefault()
        dispatch({
          type: 'moveActive',
          delta: -1,
          itemCount: suggestions.length,
        })
        return
      }
      default: {
        return
      }
    }
  }

  return (
    <form
      className={styles.container}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        close()
        onSearch()
      }}
    >
      <div
        ref={wrapperRef}
        className={clsx(styles.wrapper, showPopup && styles.wrapperOpen)}
        onBlur={handleBlur}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPopup}
          aria-controls={showPopup ? listboxId : undefined}
          aria-activedescendant={
            showPopup && state.activeIndex >= 0
              ? `${listboxId}-${state.activeIndex}`
              : undefined
          }
          onChange={(e) => {
            onChange(e.target.value)
            dispatch({ type: 'open' })
          }}
          onFocus={() => dispatch({ type: 'open' })}
          onKeyDown={handleKeyDown}
          className={styles.input}
          autoComplete="off"
          spellCheck={false}
        />
        <button className={styles.button} type="submit">
          {buttonText}
        </button>
      </div>

      {showPopup ? (
        <div className={styles.suggestions} role="listbox" id={listboxId}>
          {error ? <div className={styles.statusRow}>{error}</div> : null}
          {showSpinner ? (
            <div className={styles.statusRow}>Loading...</div>
          ) : null}
          {!isFetching && !error && suggestions.length === 0 ? (
            <div className={styles.statusRow}>No matches</div>
          ) : null}

          {suggestions.map((item: string, index: number) => (
            <button
              id={`${listboxId}-${index}`}
              key={item}
              type="button"
              tabIndex={-1}
              className={`${styles.suggestion} ${index === state.activeIndex ? styles.suggestionActive : ''}`}
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
      ) : null}
    </form>
  )
}
