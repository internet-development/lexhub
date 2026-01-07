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
  /** Check if all registered details elements are expanded */
  areAllExpanded: () => boolean
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

  const areAllExpanded = useCallback(() => {
    const elements = elementsRef.current
    if (elements.size === 0) return true
    return Array.from(elements).every((el) => el.open)
  }, [])

  return (
    <DetailsGroupContext.Provider
      value={{ expandAll, collapseAll, areAllExpanded, register }}
    >
      {children}
    </DetailsGroupContext.Provider>
  )
}
