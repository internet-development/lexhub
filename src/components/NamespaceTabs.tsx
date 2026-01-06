'use client'

import { useState } from 'react'

import styles from '@/app/(home)/page.module.css'
import cardStyles from '@/components/Card.module.css'

import { Card, CardHeader, CardBody } from '@/components/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/Table'
import NamespaceTableRow from '@/components/NamespaceTableRow'

import type { RootNamespace } from '@/db/queries'

type TabType = 'featured' | 'recent'

export interface NamespaceTabsProps {
  featured: RootNamespace[]
  recent: RootNamespace[]
}

export default function NamespaceTabs(props: NamespaceTabsProps) {
  const { featured, recent } = props
  const [activeTab, setActiveTab] = useState<TabType>('featured')

  const namespaces = activeTab === 'featured' ? featured : recent

  return (
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
        </div>
      </CardHeader>
      <CardBody className={cardStyles.bodyNoPadding}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead># of Lexicons</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {namespaces.map((namespace) => (
              <NamespaceTableRow
                key={namespace.prefix}
                name={namespace.prefix}
                lexicons={namespace.lexiconCount}
                href={`/${namespace.prefix}`}
              />
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  )
}
