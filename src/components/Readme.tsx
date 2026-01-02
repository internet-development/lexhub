'use client'

import { useState } from 'react'
import clsx from '@/common/clsx'
import styles from '@/components/Readme.module.css'
import { ReadmeContent } from '@/components/ReadmeContent'

export interface ReadmeProps {
  nsid: string
  type?: 'namespace' | 'lexicon'
  className?: string
}

export function Readme({ nsid, type = 'namespace', className }: ReadmeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isTruncatable = type === 'lexicon'

  if (!isTruncatable || isExpanded) {
    return (
      <section className={clsx(styles.section, className)}>
        <h2 className={styles.title}>README</h2>
        <div className={styles.wrapper}>
          <ReadmeContent nsid={nsid} />
        </div>
      </section>
    )
  }

  return (
    <section className={clsx(styles.section, className)}>
      <h2 className={styles.title}>README</h2>
      <div className={styles.wrapper}>
        <div className={styles.truncated}>
          <ReadmeContent nsid={nsid} />
        </div>
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
