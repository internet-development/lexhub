import Link from '@/components/Link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.copyright}>Lexhub 2025</span>
      <div className={styles.links}>
        <Link href="/legal" variant="muted" className={styles.link}>
          Privacy
        </Link>
        <span className={styles.separator}>&</span>
        <Link href="/legal" variant="muted" className={styles.link}>
          Terms of service
        </Link>
      </div>
    </footer>
  )
}
