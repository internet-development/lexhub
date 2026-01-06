import styles from '@/components/NamespaceIdentifier.module.css'

export interface NamespaceIdentifierProps {
  name: string
}

export default function NamespaceIdentifier(props: NamespaceIdentifierProps) {
  const { name } = props

  return (
    <div className={styles.root}>
      <span className={styles.name}>{name}</span>
    </div>
  )
}
