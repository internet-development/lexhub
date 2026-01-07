import cardStyles from '@/components/Card.module.css'
import styles from './NamespaceTabs.module.css'

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
import clsx from '@/util/clsx'

export interface NamespaceTabsProps {
  featured: RootNamespace[]
  recent: RootNamespace[]
  className?: string
}

export default function NamespaceTabs(props: NamespaceTabsProps) {
  const { featured, recent, className } = props

  return (
    <Card className={clsx(styles.card, className)}>
      <CardHeader>
        <h3 className={cardStyles.title}>Namespaces</h3>
      </CardHeader>
      <CardBody>
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Featured</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namespace</TableHead>
                <TableHead>Lexicons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{featured.map(NamespaceTableRow)}</TableBody>
          </Table>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Recently Updated</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namespace</TableHead>
                <TableHead>Lexicons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{recent.slice(0, 11).map(NamespaceTableRow)}</TableBody>
          </Table>
        </section>
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
