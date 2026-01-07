import Link from '@/components/Link'
import styles from './Breadcrumbs.module.css'

export interface BreadcrumbsProps {
  /** The full NSID or namespace prefix (e.g., "app.bsky.actor.profile") */
  path: string
  className?: string
}

export function Breadcrumbs({ path, className }: BreadcrumbsProps) {
  const segments = path.split('.')

  // Build cumulative paths for each segment, keeping first two together as namespace
  // e.g., "app.bsky.actor.profile" -> ["app.bsky", "app.bsky.actor", "app.bsky.actor.profile"]
  // A TLD alone (e.g., "app") is not a valid namespace in ATProto
  const crumbs = segments.slice(1).map((segment, index) => ({
    // index 0 = second segment, so we show "tld.segment" for first crumb
    label: index === 0 ? `${segments[0]}.${segment}` : segment,
    path: segments.slice(0, index + 2).join('.'),
    isLast: index === segments.length - 2,
  }))

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={styles.list}>
        {crumbs.map(({ label, path, isLast }) => (
          <li key={path} className={styles.item}>
            {isLast ? (
              <span className={styles.current} aria-current="page">
                {label}
              </span>
            ) : (
              <>
                <Link href={`/${path}`} variant="muted" className={styles.link}>
                  {label}
                </Link>
                <span className={styles.separator} aria-hidden="true">
                  ›
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
