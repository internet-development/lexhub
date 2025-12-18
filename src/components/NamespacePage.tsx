import Link from '@/components/Link'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/Table'
import styles from './NamespacePage.module.css'

export interface NamespacePageProps {
  prefix: string
  children: Array<{
    segment: string
    fullPath: string
    isLexicon: boolean
    lexiconCount: number
    description: string | null
  }>
}

export function NamespacePage({ prefix, children }: NamespacePageProps) {
  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>{prefix}</h1>
        <p className={styles.subtitle}>
          {children.length} {children.length === 1 ? 'item' : 'items'}
        </p>
      </header>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Lexicons</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>
              <span className="visually-hidden">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {children.map((child) => (
            <TableRow key={child.segment}>
              <TableCell>
                <code className={styles.segmentName}>{child.segment}</code>
              </TableCell>
              <TableCell>
                <span className={styles.typeTag}>
                  {child.isLexicon ? 'lexicon' : 'namespace'}
                </span>
              </TableCell>
              <TableCell>{child.lexiconCount.toLocaleString()}</TableCell>
              <TableCell>
                <span className={styles.description}>
                  {child.description || '-'}
                </span>
              </TableCell>
              <TableCell>
                <Link href={`/${child.fullPath}`} variant="primary">
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </article>
  )
}
