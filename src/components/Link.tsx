import styles from '@/components/Link.module.css';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import NextLink from 'next/link';
import clsx from '@/common/clsx';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: 'default' | 'primary' | 'muted';
  children: ReactNode;
  external?: boolean;
}

export default function Link(props: LinkProps) {
  const { href, variant = 'default', className = '', children, external = false, ...restProps } = props;

  const classes = clsx(styles.link, styles[variant], className);

  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <NextLink href={href} className={classes} {...externalProps} {...restProps}>
      {children}
    </NextLink>
  );
}
