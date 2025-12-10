import styles from '@/components/Table.module.scss';

import * as React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
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

export function TableHeader(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.header, className].filter(Boolean).join(' ');

  return (
    <thead className={classes} {...restProps}>
      {children}
    </thead>
  );
}

export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.body, className].filter(Boolean).join(' ');

  return (
    <tbody className={classes} {...restProps}>
      {children}
    </tbody>
  );
}

export function TableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.row, className].filter(Boolean).join(' ');

  return (
    <tr className={classes} {...restProps}>
      {children}
    </tr>
  );
}

export function TableHead(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.head, className].filter(Boolean).join(' ');

  return (
    <th className={classes} {...restProps}>
      {children}
    </th>
  );
}

export function TableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.cell, className].filter(Boolean).join(' ');

  return (
    <td className={classes} {...restProps}>
      {children}
    </td>
  );
}
