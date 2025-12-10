import styles from '@/components/Card.module.css';

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  width?: 'auto' | 'full';
  children: ReactNode;
}

export function Card(props: CardProps) {
  const { width = 'auto', className = '', children, ...restProps } = props;

  const classes = [
    styles.card,
    styles[width],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}

export function CardHeader(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.header, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}

export function CardBody(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.body, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}

export function CardFooter(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.footer, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}
