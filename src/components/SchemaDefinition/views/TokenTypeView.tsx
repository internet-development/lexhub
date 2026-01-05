import styles from '../SchemaDefinition.module.css'

export function TokenTypeView() {
  return (
    <div className={styles.tokenMessage}>
      <p>
        This is a <strong>token</strong> type. Tokens are named constants used
        as identifiers or enum-like values in the AT Protocol.
      </p>
    </div>
  )
}
