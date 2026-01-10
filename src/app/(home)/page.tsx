import cardStyles from '@/components/Card.module.css'
import styles from './page.module.css'

import { Card, CardBody, CardHeader } from '@/components/Card'
import { CodeBlock } from '@/components/CodeBlock'
import AtIcon from '@/components/icons/AtIcon'
import DocumentIcon from '@/components/icons/DocumentIcon'
import Link from '@/components/Link'
import Logo from '@/components/Logo'
import NamespaceTabs from '@/components/NamespaceTabs'
import Search from '@/components/Search'
import SocialLinks from '@/components/SocialLinks'
import StatsCard from '@/components/StatsCard'
import { getCachedRootNamespaces, getCachedStats } from '@/db/queries'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [featured, recent, stats] = await Promise.all([
    getCachedRootNamespaces('featured'),
    getCachedRootNamespaces('recentlyUpdated', 20),
    getCachedStats(),
  ])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Logo />
          <div className={styles.socialLinks}>
            <SocialLinks />
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
        </div>
      </section>

      <div className={styles.searchContainer}>
        <Search alwaysActive />
      </div>

      <main className={styles.main}>
        <div className={styles.grid}>
          <NamespaceTabs
            featured={featured}
            recent={recent}
            className={styles.namespacesCard}
          />
          <StatsCard stats={stats} />
          <GetStartedCard />
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

const installCommand = `$ npx @atproto/lex install app.bsky.actor.getProfile`

const exampleCode = `import { Client } from '@atproto/lex'
import * as app from './lexicons/app.js'

// Create a client instance
const client = new Client('https://public.api.bsky.app')

// Start making requests using generated schemas
const response = await client.call(app.bsky.actor.getProfile, {
  actor: 'caidan.dev',
})`

async function GetStartedCard() {
  return (
    <Card className={styles.fullHeightCard}>
      <CardHeader>
        <h3 className={cardStyles.title}>Getting Started with JavaScript</h3>
      </CardHeader>
      <CardBody>
        <p className={styles.getStartedText}>
          Install the schemas you want to build with:
        </p>

        <CodeBlock
          code={installCommand}
          lang="bash"
          className={styles.codeBlockSpacing}
        />

        <p className={styles.getStartedText}>And start building:</p>

        <CodeBlock
          code={exampleCode}
          lang="javascript"
          className={styles.codeBlockSpacing}
        />

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
