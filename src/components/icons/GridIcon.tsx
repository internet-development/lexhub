import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

export default function GridIcon(props: IconProps) {
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
        d="M1 2C1 1.44772 1.44772 1 2 1H6C6.55228 1 7 1.44772 7 2V6C7 6.55228 6.55228 7 6 7H2C1.44772 7 1 6.55228 1 6V2ZM2.5 2.5V5.5H5.5V2.5H2.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 2C9 1.44772 9.44772 1 10 1H14C14.5523 1 15 1.44772 15 2V6C15 6.55228 14.5523 7 14 7H10C9.44772 7 9 6.55228 9 6V2ZM10.5 2.5V5.5H13.5V2.5H10.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 10C1 9.44772 1.44772 9 2 9H6C6.55228 9 7 9.44772 7 10V14C7 14.5523 6.55228 15 6 15H2C1.44772 15 1 14.5523 1 14V10ZM2.5 10.5V13.5H5.5V10.5H2.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 10C9 9.44772 9.44772 9 10 9H14C14.5523 9 15 9.44772 15 10V14C15 14.5523 14.5523 15 14 15H10C9.44772 15 9 14.5523 9 14V10ZM10.5 10.5V13.5H13.5V10.5H10.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
