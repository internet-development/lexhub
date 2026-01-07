'use client'

import { useState } from 'react'

import styles from '@/app/(home)/page.module.css'
import cardStyles from '@/components/Card.module.css'

import { Card, CardBody, CardHeader } from '@/components/Card'
import Link from '@/components/Link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/Table'

import type { RootNamespace } from '@/db/queries'

const MAX_ROWS = 9

type TabType = 'featured' | 'recent'

export interface NamespaceTabsProps {
  featured: RootNamespace[]
  recent: RootNamespace[]
  className?: string
}

export default function NamespaceTabs(props: NamespaceTabsProps) {
  const { featured, recent, className } = props
  const [activeTab, setActiveTab] = useState<TabType>('featured')

  const namespaces = activeTab === 'featured' ? featured : recent

  return (
    <Card height="full" className={className}>
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
      <CardBody>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead># of Lexicons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {namespaces.slice(0, MAX_ROWS).map(NamespaceTableRow)}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  )
}

function NamespaceTableRow(namespace: RootNamespace) {
  return (
    <TableRow key={namespace.prefix}>
      <TableCell>
        <Link variant="primary" href={`/${namespace.prefix}`}>
          {namespace.prefix}
        </Link>
      </TableCell>
      <TableCell>{namespace.lexiconCount.toLocaleString()}</TableCell>
    </TableRow>
  )
}
