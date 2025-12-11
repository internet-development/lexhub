import styles from '@/components/NamespaceTableRow.module.css';

import { TableRow, TableCell } from '@/components/Table';
import Link from '@/components/Link';
import NamespaceIdentifier, { IconType } from '@/components/NamespaceIdentifier';

export interface NamespaceTableRowProps {
  icon: IconType;
  name: string;
  lexicons: number;
  description: string;
  href: string;
}

export default function NamespaceTableRow(props: NamespaceTableRowProps) {
  const { icon, name, lexicons, description, href } = props;

  return (
    <TableRow>
      <TableCell>
        <NamespaceIdentifier icon={icon} name={name} />
      </TableCell>
      <TableCell>{lexicons.toLocaleString()}</TableCell>
      <TableCell>
        <span className={styles.description}>{description}</span>
      </TableCell>
      <TableCell>
        <Link href={href} variant="primary" className={styles.viewLink}>
          View
        </Link>
      </TableCell>
    </TableRow>
  );
}
