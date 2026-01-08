import Link from './Link'

export interface LogoProps {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      variant="default"
      className={className}
      style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-bold)',
      }}
    >
      LexHub
    </Link>
  )
}
