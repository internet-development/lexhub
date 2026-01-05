import type { LexPermission, LexPermissionSet } from '@atproto/lexicon'
import styles from '../SchemaDefinition.module.css'

/** Safely extract a string array from a permission record */
function getPermissionStringArray(perm: LexPermission, key: string): string[] {
  const value = perm[key]
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string')
  }
  return []
}

/** Extract display info from a repo permission */
function getRepoPermissionInfo(perm: LexPermission): {
  collections: string[]
  actions: string[]
} {
  const actions = getPermissionStringArray(perm, 'action')
  return {
    collections: getPermissionStringArray(perm, 'collection'),
    // If no actions specified, all operations are allowed per spec
    actions: actions.length > 0 ? actions : ['create', 'update', 'delete'],
  }
}

/** Extract display info from an RPC permission */
function getRpcPermissionInfo(perm: LexPermission): {
  methods: string[]
  audience: string
} {
  const inheritAud = perm['inheritAud']
  const aud = perm['aud']

  let audience: string
  if (inheritAud === true) {
    audience = 'inherit'
  } else if (typeof aud === 'string') {
    audience = aud
  } else {
    audience = 'unspecified'
  }

  return {
    methods: getPermissionStringArray(perm, 'lxm'),
    audience,
  }
}

export function PermissionSetTypeView({ def }: { def: LexPermissionSet }) {
  const repoPermissions = def.permissions.filter((p) => p.resource === 'repo')
  const rpcPermissions = def.permissions.filter((p) => p.resource === 'rpc')

  return (
    <div className={styles.fieldSections}>
      {def.title && (
        <div className={styles.permissionSetHeader}>
          <h3 className={styles.permissionSetTitle}>{def.title}</h3>
          {def.detail && (
            <p className={styles.permissionSetDetail}>{def.detail}</p>
          )}
        </div>
      )}

      {repoPermissions.length > 0 && (
        <section className={styles.fieldSection}>
          <h4 className={styles.fieldSectionTitle}>Repo Collections</h4>
          {repoPermissions.map((p, i) => {
            const { collections, actions } = getRepoPermissionInfo(p)
            return (
              <div key={i} className={styles.permissionGroup}>
                <p className={styles.permissionActions}>
                  Actions: {actions.join(', ')}
                </p>
                <ul className={styles.permissionList}>
                  {collections.map((col, j) => (
                    <li key={`${i}-${j}`} className={styles.permissionItem}>
                      <a href={`/${col}`} className={styles.fieldRefLink}>
                        {col}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </section>
      )}

      {rpcPermissions.length > 0 && (
        <section className={styles.fieldSection}>
          <h4 className={styles.fieldSectionTitle}>RPC Methods</h4>
          {rpcPermissions.map((p, i) => {
            const { methods, audience } = getRpcPermissionInfo(p)
            return (
              <div key={i} className={styles.permissionGroup}>
                <p className={styles.permissionActions}>Audience: {audience}</p>
                <ul className={styles.permissionList}>
                  {methods.map((method, j) => (
                    <li key={`${i}-${j}`} className={styles.permissionItem}>
                      <a href={`/${method}`} className={styles.fieldRefLink}>
                        {method}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </section>
      )}

      {def.permissions.length === 0 && (
        <div className={styles.noFields}>No permissions defined.</div>
      )}
    </div>
  )
}
