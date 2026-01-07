'use client'

import { useState, useEffect } from 'react'
import { useDetailsGroup } from './DetailsGroupContext'
import ChevronIcon from '@/components/icons/ChevronIcon'
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
      <ChevronIcon size={20} className={styles.chevron} aria-hidden="true" />
    </button>
  )
}
