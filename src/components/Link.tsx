import styles from '@/components/Link.module.scss';

import * as React from 'react';
import NextLink from 'next/link';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: 'default' | 'primary' | 'muted';
  children: React.ReactNode;
  external?: boolean;
}

export default function Link(props: LinkProps) {
  const { href, variant = 'default', className = '', children, external = false, ...restProps } = props;

  const classes = [
    styles.link,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <NextLink href={href} className={classes} {...externalProps} {...restProps}>
      {children}
    </NextLink>
  );
}
