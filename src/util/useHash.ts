'use client'

import { useState, useEffect } from 'react'

/**
 * Hook that returns the current URL hash (without the leading #).
 * Updates when the hash changes via hashchange event or Next.js navigation.
 */
export function useHash(): string {
  const [hash, setHash] = useState('')

  useEffect(() => {
    // Set initial hash
    setHash(window.location.hash.slice(1))

    function handleHashChange() {
      setHash(window.location.hash.slice(1))
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    // For Next.js client-side navigations, we need to poll since
    // hashchange doesn't fire for same-page navigations via Next.js Link
    let lastHash = window.location.hash
    const interval = setInterval(() => {
      if (window.location.hash !== lastHash) {
        lastHash = window.location.hash
        setHash(window.location.hash.slice(1))
      }
    }, 50)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      clearInterval(interval)
    }
  }, [])

  return hash
}
