import styles from '@/components/LexButton.module.scss';

import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function LexButton(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className = '', children, ...restProps } = props;

  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...restProps}>
      {children}
    </button>
  );
}
