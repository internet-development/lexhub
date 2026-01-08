'use client'

import styles from './Header.module.css'

import Logo from '@/components/Logo'
import Search from '@/components/Search'
import SocialLinks from '@/components/SocialLinks'

export default function Header() {
  return (
    <header className={styles.container}>
      <div className={styles.logo}>
        <Logo />
        <div className={styles.mobileIcons}>
          <SocialLinks />
        </div>
      </div>

      <div className={styles.rightSection}>
        <Search />

        <div className={styles.icons}>
          <SocialLinks />
        </div>
      </div>
    </header>
  )
}
