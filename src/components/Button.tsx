import styles from '@/components/Button.module.css'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from '@/util/clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function LexButton(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...restProps
  } = props

  const classes = clsx(styles.button, styles[variant], styles[size], className)

  return (
    <button className={classes} {...restProps}>
      {children}
    </button>
  )
}
