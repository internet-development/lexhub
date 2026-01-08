import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

export default function HashIcon(props: IconProps) {
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
        d="M6.5 1L5.5 6H2V7.5H5.25L4.75 10H1V11.5H4.5L3.5 16.5H5L6 11.5H9L8 16.5H9.5L10.5 11.5H14V10H10.75L11.25 7.5H15V6H11.5L12.5 1H11L10 6H7L8 1H6.5ZM6.75 7.5L6.25 10H9.25L9.75 7.5H6.75Z"
        fill="currentColor"
      />
    </svg>
  )
}
