'use client'

import Button from '@/components/Button'
import { useDetailsGroup } from './DetailsGroupContext'
import styles from './DetailsGroupControls.module.css'

interface DetailsGroupControlsProps {
  className?: string
}

export function DetailsGroupControls({ className }: DetailsGroupControlsProps) {
  const { expandAll, collapseAll } = useDetailsGroup()

  return (
    <div className={`${styles.controls} ${className ?? ''}`}>
      <Button variant="ghost" size="sm" onClick={expandAll}>
        Expand All
      </Button>
      <span className={styles.divider} aria-hidden="true" />
      <Button variant="ghost" size="sm" onClick={collapseAll}>
        Collapse All
      </Button>
    </div>
  )
}
