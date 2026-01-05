import styles from '@/components/Table.module.css'

import type {
  TableHTMLAttributes,
  HTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
  ReactNode,
} from 'react'
import clsx from '@/util/clsx'

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode
}

export function Table(props: TableProps) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.table, className)

  return (
    <div className={styles.wrapper}>
      <table className={classes} {...restProps}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.header, className)

  return (
    <thead className={classes} {...restProps}>
      {children}
    </thead>
  )
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.body, className)

  return (
    <tbody className={classes} {...restProps}>
      {children}
    </tbody>
  )
}

export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.row, className)

  return (
    <tr className={classes} {...restProps}>
      {children}
    </tr>
  )
}

export function TableHead(props: ThHTMLAttributes<HTMLTableCellElement>) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.head, className)

  return (
    <th className={classes} {...restProps}>
      {children}
    </th>
  )
}

export function TableCell(props: TdHTMLAttributes<HTMLTableCellElement>) {
  const { className = '', children, ...restProps } = props

  const classes = clsx(styles.cell, className)

  return (
    <td className={classes} {...restProps}>
      {children}
    </td>
  )
}
