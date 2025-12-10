import styles from '@/components/Table.module.css';

import type { TableHTMLAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, ReactNode } from 'react';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table(props: TableProps) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.table, className].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      <table className={classes} {...restProps}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.header, className].filter(Boolean).join(' ');

  return (
    <thead className={classes} {...restProps}>
      {children}
    </thead>
  );
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.body, className].filter(Boolean).join(' ');

  return (
    <tbody className={classes} {...restProps}>
      {children}
    </tbody>
  );
}

export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.row, className].filter(Boolean).join(' ');

  return (
    <tr className={classes} {...restProps}>
      {children}
    </tr>
  );
}

export function TableHead(props: ThHTMLAttributes<HTMLTableCellElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.head, className].filter(Boolean).join(' ');

  return (
    <th className={classes} {...restProps}>
      {children}
    </th>
  );
}

export function TableCell(props: TdHTMLAttributes<HTMLTableCellElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.cell, className].filter(Boolean).join(' ');

  return (
    <td className={classes} {...restProps}>
      {children}
    </td>
  );
}
