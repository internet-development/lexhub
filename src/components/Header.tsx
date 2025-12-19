'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import Search from '@/components/Search'
import BlueskyIcon from '@/components/BlueskyIcon'
import GitHubIcon from '@/components/GitHubIcon'
import Link from '@/components/Link'
import styles from './Header.module.css'

export interface HeaderProps {
  initialSearchValue?: string
}

export default function Header({ initialSearchValue = '' }: HeaderProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(initialSearchValue)

  const handleSearch = () => {
    if (searchValue.trim()) {
      router.push(`/${searchValue.trim()}`)
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" variant="default">
            <Logo className={styles.logoText} />
          </Link>
        </div>

        <div className={styles.search}>
          <Search
            value={searchValue}
            onChange={setSearchValue}
            onSearch={handleSearch}
            placeholder="Search Lexicons, Namespaces..."
            buttonText="Search"
          />
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
