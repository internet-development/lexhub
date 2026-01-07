'use client'

import { useEffect, useRef } from 'react'
import { useDetailsGroup } from './DetailsGroupContext'

/**
 * Hook that returns a ref to attach to a <details> element.
 * Automatically registers/unregisters the element with the DetailsGroupProvider.
 */
export function useDetailsRef() {
  const { register } = useDetailsGroup()
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const element = ref.current
    if (element) {
      return register(element)
    }
  }, [register])

  return ref
}
