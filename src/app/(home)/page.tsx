import cardStyles from '@/components/Card.module.css'
import styles from './page.module.css'

import { Card, CardBody, CardHeader } from '@/components/Card'
import AtIcon from '@/components/icons/AtIcon'
import BlueskyIcon from '@/components/icons/BlueskyIcon'
import DocumentIcon from '@/components/icons/DocumentIcon'
import GitHubIcon from '@/components/icons/GitHubIcon'
import Link from '@/components/Link'
import Logo from '@/components/Logo'
import NamespaceTabs from '@/components/NamespaceTabs'
import Search from '@/components/Search'

import { getRootNamespaces } from '@/db/queries'

export default async function HomePage() {
  const [featured, recent] = await Promise.all([
    getRootNamespaces({ sortBy: 'featured' }),
    getRootNamespaces({ sortBy: 'recentlyUpdated', limit: 20 }),
  ])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Logo />
          <div className={styles.socialLinks}>
            <a
              href="https://bsky.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BlueskyIcon size={20} variant="interactive" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon size={20} variant="interactive" />
            </a>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>
            Explore ideas. Remix code.
            <br />
            Build amazing protocols.
          </h2>
          <p className={styles.heroDescription}>
            Jump into the ecosystem and explore real examples. See how builders
            solve problems, test ideas, and turn concepts into protocols.
          </p>

          <div className={styles.heroButtons}>
            <Link href="#about" variant="primary" className={styles.heroLink}>
              <AtIcon size={16} />
              About ATProto
            </Link>
            <Link href="#docs" variant="primary" className={styles.heroLink}>
              <DocumentIcon size={16} />
              Documentation
            </Link>
          </div>

          <div className={styles.searchContainer}>
            <Search />
          </div>
        </div>
      </section>

      <main className={styles.main}>
        <div className={styles.grid}>
          <GetStartedCard />
          <NamespaceTabs featured={featured} recent={recent} />
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>LexHub 2026</p>
          <div className={styles.footerLinks}>
            <Link href="#privacy" variant="muted">
              Privacy
            </Link>
            <span className={styles.footerSeparator}>&</span>
            <Link href="#terms" variant="muted">
              Terms of service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function GetStartedCard() {
  return (
    <Card className={styles.fullHeightCard}>
      <CardHeader>
        <h3 className={cardStyles.title}>Get started</h3>
      </CardHeader>
      <CardBody>
        <p className={styles.getStartedText}>
          Install the schemas you want to build with:
        </p>

        <div className={styles.codeBlock}>
          <code className={styles.code}>
            $ npx @atproto/lex install app.bsky.actor.getProfile
          </code>
        </div>

        <p className={styles.getStartedText}>And start building:</p>

        <div className={styles.codeBlock}>
          <pre className={styles.codeMultiline}>
            <code>{`import { Client } from '@atproto/lex'
import * as app from './lexicons/app.js'

// Create a client instance
const client = new Client('https://public.api.bsky.app')

// Start making requests using generated schemas
const response = await client.call(app.bsky.actor.getProfile, {
  actor: 'pfrazee.com',
})`}</code>
          </pre>
        </div>

        <Link href="#docs" variant="primary" style={{ fontSize: '14px' }}>
          Read the docs
        </Link>
        <span className={styles.getStartedText}>
          {' '}
          for other languages and to learn more.
        </span>
      </CardBody>
    </Card>
  )
}
