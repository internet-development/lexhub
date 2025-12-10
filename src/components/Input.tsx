import styles from '@/components/LexInput.module.scss';

import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function LexInput(props: InputProps) {
  const { className = '', error = false, ...restProps } = props;

  const classes = [
    styles.input,
    error ? styles.error : '',
    className
  ].filter(Boolean).join(' ');

  return <input className={classes} {...restProps} />;
}
