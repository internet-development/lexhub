'use client'

import styles from './page.module.css'
import cardStyles from '@/components/Card.module.css'

import { useState } from 'react'

import { Card, CardHeader, CardBody } from '@/components/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/Table'
import Link from '@/components/Link'
import Search from '@/components/Search'
import NamespaceTableRow from '@/components/NamespaceTableRow'
import BlueskyIcon from '@/components/BlueskyIcon'
import GitHubIcon from '@/components/GitHubIcon'
import AtIcon from '@/components/AtIcon'
import DocumentIcon from '@/components/DocumentIcon'
import Logo from '@/components/Logo'

type TabType = 'featured' | 'recent' | 'viewed'

interface Namespace {
  name: string
  icon: 'bluesky' | 'globe' | 'at'
  lexicons: number
  description: string
}

const namespaces: Namespace[] = [
  {
    name: 'bsky.app',
    icon: 'bluesky',
    lexicons: 4827,
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
  },
  {
    name: 'bsky.chat',
    icon: 'bluesky',
    lexicons: 1394,
    description:
      'Curabitur fringilla erat a leo imperdiet, vitae vehicula erat vehicula...',
  },
  {
    name: 'atproto.com',
    icon: 'bluesky',
    lexicons: 7502,
    description:
      'Suspendisse quis orci nec velit pretium tempor et sit amet tellus',
  },
  {
    name: 'ozone.tools',
    icon: 'at',
    lexicons: 9041,
    description: 'Maecenas congue diam eget mi posuere vestibulum',
  },
  {
    name: 'statusphere.xyz',
    icon: 'at',
    lexicons: 2678,
    description: 'Cras nec ligula consequat, tristique eros ac, euismod enim',
  },
  {
    name: 'robocracy.org',
    icon: 'at',
    lexicons: 5180,
    description: 'Donec venenatis dolor ut quam pretium sodales',
  },
  {
    name: 'atprofile.com',
    icon: 'globe',
    lexicons: 3409,
    description: 'Aenean consectetur orci vitae orci semper eleifend',
  },
  {
    name: 'skyblur.uk',
    icon: 'globe',
    lexicons: 7713,
    description: 'Aenean ut nisi a augue venenatis egestas',
  },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('featured')

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
          <Card className={styles.fullHeightCard}>
            <CardHeader>
              <h3 className={cardStyles.title}>Namespaces</h3>
              <div className={styles.tabs}>
                <button
                  onClick={() => setActiveTab('featured')}
                  className={`${styles.tab} ${activeTab === 'featured' ? styles.active : ''}`}
                >
                  Featured
                </button>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`${styles.tab} ${activeTab === 'recent' ? styles.active : ''}`}
                >
                  Recently Updated
                </button>
                <button
                  onClick={() => setActiveTab('viewed')}
                  className={`${styles.tab} ${activeTab === 'viewed' ? styles.active : ''}`}
                >
                  Most Viewed
                </button>
              </div>
            </CardHeader>
            <CardBody className={cardStyles.bodyNoPadding}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead># of Lexicons</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {namespaces.map((namespace, index) => (
                    <NamespaceTableRow
                      key={index}
                      icon={namespace.icon}
                      name={namespace.name}
                      lexicons={namespace.lexicons}
                      description={namespace.description}
                      href={`/${namespace.name}`}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

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
