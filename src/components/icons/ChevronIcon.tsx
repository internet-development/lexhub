import type { SVGProps } from 'react'

export interface ChevronIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

export default function ChevronIcon(props: ChevronIconProps) {
  const { size = 20, className = '', ...restProps } = props

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...restProps}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
