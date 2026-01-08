import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

export default function FolderIcon(props: IconProps) {
  const { size = 16, className = '', ...restProps } = props

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      {...restProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 3C1 2.44772 1.44772 2 2 2H6L7.5 4H14C14.5523 4 15 4.44772 15 5V13C15 13.5523 14.5523 14 14 14H2C1.44772 14 1 13.5523 1 13V3ZM2.5 5.5V12.5H13.5V5.5H2.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
