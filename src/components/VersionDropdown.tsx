import { formatDistanceToNow, format } from 'date-fns'
import type { LexiconVersion } from '@/db/queries'
import ChevronIcon from '@/components/icons/ChevronIcon'
import clsx from '@/util/clsx'
import styles from './VersionDropdown.module.css'

export interface VersionDropdownProps {
  nsid: string
  currentCid: string
  versions: LexiconVersion[]
}

export function VersionDropdown({
  nsid,
  currentCid,
  versions,
}: VersionDropdownProps) {
  const currentVersion = versions.find((v) => v.cid === currentCid)
  const isLatest = versions[0]?.cid === currentCid

  return (
    <details className={styles.root}>
      <summary className={styles.summary}>
        <span className={styles.summaryText}>
          <span className={styles.cid}>{formatCid(currentCid)}</span>
          {currentVersion && (
            <span
              className={styles.date}
              title={formatAbsoluteDate(currentVersion.ingestedAt)}
            >
              {formatRelativeTime(currentVersion.ingestedAt)}
            </span>
          )}
        </span>
        <ChevronIcon size={16} className={styles.chevron} />
      </summary>
      <div className={styles.menu}>
        {versions.map((version, index) => {
          const isCurrent = version.cid === currentCid
          const isLatestVersion = index === 0

          return (
            <a
              key={version.cid}
              href={`/${nsid}?cid=${version.cid}`}
              className={clsx(styles.item, isCurrent && styles.itemCurrent)}
            >
              <div className={styles.itemHeader}>
                <time
                  className={styles.itemDate}
                  dateTime={version.ingestedAt.toISOString()}
                  title={version.ingestedAt.toISOString()}
                >
                  <span>{formatRelativeTime(version.ingestedAt)}</span>
                  <span>&nbsp; - &nbsp;</span>
                  <span>{formatAbsoluteDate(version.ingestedAt)}</span>
                </time>
                {isLatestVersion && (
                  <span className={styles.badge}>latest</span>
                )}
              </div>
              <div className={styles.itemRow}>
                <span className={styles.label}>cid</span>
                <span className={styles.value}>{version.cid}</span>
              </div>
              <div className={styles.itemRow}>
                <span className={styles.label}>did</span>
                <span className={styles.value}>{version.repoDid}</span>
              </div>
              <div className={styles.itemRow}>
                <span className={styles.label}>rev</span>
                <span className={styles.value}>{version.repoRev}</span>
              </div>
            </a>
          )
        })}
      </div>
    </details>
  )
}

/**
 * Formats a CID for display: first 5 chars + ... + last 10 chars
 * e.g., "bafyreib..." -> "bafyr...eib123"
 */
function formatCid(cid: string): string {
  if (cid.length <= 18) return cid
  return `${cid.slice(0, 5)}...${cid.slice(-10)}`
}

/**
 * Formats a date as relative time
 * e.g., "2 days ago", "about 1 month ago"
 */
function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

/**
 * Formats a date as absolute
 * e.g., "Jan 8, 2026"
 */
function formatAbsoluteDate(date: Date): string {
  return format(date, 'PPpp')
}
