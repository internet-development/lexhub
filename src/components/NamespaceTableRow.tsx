import { TableRow, TableCell } from '@/components/Table'
import Link from '@/components/Link'
import NamespaceIdentifier from '@/components/NamespaceIdentifier'

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
        <Link href={href} variant="primary">
          <NamespaceIdentifier name={name} />
        </Link>
      </TableCell>
      <TableCell>{lexicons.toLocaleString()}</TableCell>
    </TableRow>
  )
}
