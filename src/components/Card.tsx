import styles from '@/components/Card.module.css'

import type { HTMLAttributes, ReactNode } from 'react'
import clsx from '@/util/clsx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  width?: 'auto' | 'full'
  height?: 'auto' | 'full'
  children?: ReactNode
}

export function Card(props: CardProps) {
  const {
    width = 'auto',
    height = 'auto',
    className = '',
    children,
    ...restProps
  } = props

  const classes = clsx(
    styles.card,
    styles['w-' + width],
    styles['h-' + height],
    className,
  )

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  )
}

export function CardHeader(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.header, className)

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  )
}

export function CardBody(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.body, className)

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  )
}

export function CardFooter(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.footer, className)

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  )
}
