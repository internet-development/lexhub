import { formatDistanceToNow, format } from 'date-fns'
import type { LexiconVersion } from '@/db/queries'
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
          {isLatest && <span className={styles.badge}>latest</span>}
        </span>
        <svg
          className={styles.chevron}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
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
              <span className={styles.itemCid}>{formatCid(version.cid)}</span>
              <span
                className={styles.itemDate}
                title={formatAbsoluteDate(version.ingestedAt)}
              >
                {formatRelativeTime(version.ingestedAt)}
              </span>
              <span className={styles.itemDid}>
                {formatDid(version.repoDid)}
              </span>
              {isLatestVersion && <span className={styles.badge}>latest</span>}
            </a>
          )
        })}
      </div>
    </details>
  )
}

/**
 * Formats a CID for display: first 3 chars + ... + last 6 chars
 * e.g., "bafyreib..." -> "baf...eib123"
 */
function formatCid(cid: string): string {
  if (cid.length <= 12) return cid
  return `${cid.slice(0, 3)}...${cid.slice(-6)}`
}

/**
 * Formats a DID for display: removes prefix and shows first 8 chars
 * e.g., "did:plc:abc123xyz" -> "abc123xy..."
 */
function formatDid(did: string): string {
  const short = did.replace(/^did:(plc|web):/, '')
  return short.length > 8 ? `${short.slice(0, 8)}...` : short
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
  return format(date, 'MMM d, yyyy')
}
