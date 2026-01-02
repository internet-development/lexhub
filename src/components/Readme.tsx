'use client'

import { useState, type ReactNode } from 'react'
import clsx from '@/common/clsx'
import styles from '@/components/Readme.module.css'

export interface ReadmeProps {
  type?: 'namespace' | 'lexicon'
  className?: string
  children: ReactNode
}

export function Readme({
  type = 'namespace',
  className,
  children,
}: ReadmeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isTruncatable = type === 'lexicon'

  if (!isTruncatable || isExpanded) {
    return (
      <section className={clsx(styles.section, className)}>
        <h2 className={styles.title}>README</h2>
        <div className={styles.wrapper}>{children}</div>
      </section>
    )
  }

  return (
    <section className={clsx(styles.section, className)}>
      <h2 className={styles.title}>README</h2>
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
    </section>
  )
}
