export interface LogoProps {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <span
      className={className}
      style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--color-text-primary)',
      }}
    >
      LexHub
    </span>
  )
}
