import type { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export default function AtIcon(props: IconProps) {
  const { size = 24, className = '', ...restProps } = props;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2D68F8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...restProps}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M16 12v1a3 3 0 0 0 3 3c1.66 0 3-1.34 3-3V12a10 10 0 1 0-4 8" />
    </svg>
  );
}
