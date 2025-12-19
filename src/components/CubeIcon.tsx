import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

export default function CubeIcon(props: IconProps) {
  const { size = 17, className = '', ...restProps } = props

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 16"
      fill="none"
      className={className}
      {...restProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.0033 4L8.0263 0L15.0493 4V12L8.0263 16L1.0033 12V4ZM2.50822 5.72096V11.1295L7.27383 13.8438V8.43524L2.50822 5.72096ZM8.77876 13.8438L13.5444 11.1295V5.72096L8.77876 8.43524V13.8438ZM12.7743 4.43191L8.0263 1.72763L3.27826 4.43191L8.0263 7.13619L12.7743 4.43191Z"
        fill="var(--color-text-secondary)"
      />
    </svg>
  )
}
