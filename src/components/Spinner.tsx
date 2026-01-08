import styles from './Spinner.module.css'
import clsx from '@/util/clsx'

interface SpinnerProps {
  size?: number
  className?: string
}

export default function Spinner({ size = 16, className }: SpinnerProps) {
  return (
    <span
      className={clsx(styles.spinner, className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  )
}
