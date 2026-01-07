'use client'

import { useState, useEffect } from 'react'
import { useDetailsGroup } from './DetailsGroupContext'
import styles from './DetailsGroupControls.module.css'

interface DetailsGroupControlsProps {
  className?: string
}

export function DetailsGroupControls({ className }: DetailsGroupControlsProps) {
  const { expandAll, collapseAll, areAllExpanded } = useDetailsGroup()
  const [expanded, setExpanded] = useState(true)

  // Check initial state on mount
  useEffect(() => {
    setExpanded(areAllExpanded())
  }, [areAllExpanded])

  const toggle = () => {
    if (expanded) {
      collapseAll()
    } else {
      expandAll()
    }
    setExpanded(!expanded)
  }

  return (
    <button
      className={`${styles.toggle} ${className ?? ''}`}
      onClick={toggle}
      aria-expanded={expanded}
    >
      {expanded ? 'Collapse All' : 'Expand All'}
      <svg
        className={styles.chevron}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}
