import styles from '@/components/Card.module.scss';

import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: 'auto' | 'full';
  children: React.ReactNode;
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

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.header, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}

export function CardBody(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.body, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}

export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = '', children, ...restProps } = props;

  const classes = [styles.footer, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}
