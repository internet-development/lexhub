import { TableRow, TableCell } from '@/components/Table'
import Link from '@/components/Link'
import NamespaceIdentifier from '@/components/NamespaceIdentifier'

import styles from '@/components/NamespaceTableRow.module.css'

export interface NamespaceTableRowProps {
  name: string
  lexicons: number
  href: string
}

export default function NamespaceTableRow(props: NamespaceTableRowProps) {
  const { name, lexicons, href } = props

  return (
    <TableRow>
      <TableCell>
        <NamespaceIdentifier name={name} />
      </TableCell>
      <TableCell>{lexicons.toLocaleString()}</TableCell>
      <TableCell>
        <Link href={href} variant="primary" className={styles.viewLink}>
          View
        </Link>
      </TableCell>
    </TableRow>
  )
}
