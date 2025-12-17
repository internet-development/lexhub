export interface LogoProps {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return <h1 className={className}>LexHub</h1>
}
