'use client'

import { useState, type ReactNode } from 'react'
import styles from '@/components/Readme.module.css'

export interface ReadmeProps {
  type?: 'namespace' | 'lexicon'
  children: ReactNode
}

export function Readme({ type = 'namespace', children }: ReadmeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isTruncatable = type === 'lexicon'

  if (!isTruncatable || isExpanded) {
    return <div className={styles.wrapper}>{children}</div>
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.truncated}>{children}</div>
      <button
        className={styles.seeMore}
        onClick={() => setIsExpanded(true)}
        type="button"
      >
        See more
      </button>
    </div>
  )
}
