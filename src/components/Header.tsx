'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import Search from '@/components/Search'
import BlueskyIcon from '@/components/icons/BlueskyIcon'
import GitHubIcon from '@/components/icons/GitHubIcon'
import Link from '@/components/Link'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.container}>
      <div className={styles.logo}>
        <Link href="/" variant="default">
          <Logo />
        </Link>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.search}>
          <Search />
        </div>

        <div className={styles.icons}>
          <a
            href="https://bsky.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bluesky"
            className={styles.iconLink}
          >
            <BlueskyIcon size={18} variant="interactive" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className={styles.iconLink}
          >
            <GitHubIcon size={18} variant="interactive" />
          </a>
        </div>
      </div>
    </header>
  )
}
