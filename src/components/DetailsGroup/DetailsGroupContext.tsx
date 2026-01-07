'use client'

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'

interface DetailsGroupContextValue {
  /** Expand all registered details elements */
  expandAll: () => void
  /** Collapse all registered details elements */
  collapseAll: () => void
  /** Register a details element, returns unregister function */
  register: (element: HTMLDetailsElement) => () => void
}

const DetailsGroupContext = createContext<DetailsGroupContextValue | null>(null)

export function useDetailsGroup() {
  const context = useContext(DetailsGroupContext)
  if (!context) {
    throw new Error(
      'useDetailsGroup must be used within a DetailsGroupProvider',
    )
  }
  return context
}

interface DetailsGroupProviderProps {
  children: ReactNode
}

export function DetailsGroupProvider({ children }: DetailsGroupProviderProps) {
  const elementsRef = useRef<Set<HTMLDetailsElement>>(new Set())

  const register = useCallback((element: HTMLDetailsElement) => {
    elementsRef.current.add(element)
    return () => {
      elementsRef.current.delete(element)
    }
  }, [])

  const expandAll = useCallback(() => {
    elementsRef.current.forEach((el) => {
      el.open = true
    })
  }, [])

  const collapseAll = useCallback(() => {
    elementsRef.current.forEach((el) => {
      el.open = false
    })
  }, [])

  return (
    <DetailsGroupContext.Provider value={{ expandAll, collapseAll, register }}>
      {children}
    </DetailsGroupContext.Provider>
  )
}
