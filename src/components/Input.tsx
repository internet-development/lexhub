import styles from '@/components/Input.module.css';

import type { InputHTMLAttributes } from 'react';
import clsx from '@/common/clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function LexInput(props: InputProps) {
  const { className = '', error = false, ...restProps } = props;

  const classes = clsx(styles.input, error && styles.error, className);

  return <input className={classes} {...restProps} />;
}
