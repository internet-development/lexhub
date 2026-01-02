'use client'

import { useState } from 'react'
import styles from '@/components/Readme.module.css'

export interface ReadmeBodyProps {
  type: 'namespace' | 'lexicon'
  html: string
}

export function ReadmeBody({ type, html }: ReadmeBodyProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isTruncatable = type === 'lexicon'

  if (!isTruncatable || isExpanded) {
    return (
      <div className={styles.wrapper}>
        <article
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.truncated}>
        <article
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
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
