'use client'

import { useHash } from '@/util/useHash'
import type { LexUserType } from '@atproto/lexicon'
import { useEffect, useState } from 'react'
import { useDetailsRef } from '@/components/DetailsGroup'
import ChevronIcon from '@/components/icons/ChevronIcon'
import styles from './SchemaDefinition.module.css'

import { ObjectTypeView } from './views/ObjectTypeView'
import {
  QueryTypeView,
  ProcedureTypeView,
  SubscriptionTypeView,
} from './views/ApiTypeViews'
import { PermissionSetTypeView } from './views/PermissionSetTypeView'
import { ScalarTypeView } from './views/ScalarTypeView'
import { TokenTypeView } from './views/TokenTypeView'
import type { TypeCategory } from './utils/types'

export interface SchemaDefinitionProps {
  name: string
  def: LexUserType
  highlightedJson: string
}

export function SchemaDefinition({
  name,
  def,
  highlightedJson,
}: SchemaDefinitionProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'json'>('fields')
  const detailsRef = useDetailsRef()
  const hash = useHash()
  const category = getTypeCategory(def)
  const fieldsTabLabel =
    category === 'scalar' || category === 'token'
      ? 'TYPE INFO'
      : category === 'permission-set'
        ? 'PERMISSIONS'
        : 'DATA FIELDS'

  useEffect(() => {
    if (hash === name && detailsRef.current) {
      detailsRef.current.open = true
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 0)
    }
  }, [hash, name])

  return (
    <details ref={detailsRef} className={styles.defDetails} open>
      <summary className={styles.defHeader}>
        <span className={styles.defName}>{name}</span>
        <div className={styles.defHeaderRight}>
          <span className={styles.defType}>{def.type.toUpperCase()}</span>
          <ChevronIcon size={20} className={styles.chevron} />
        </div>
      </summary>
      <div className={styles.defContent}>
        {def.description && (
          <div className={styles.defDescriptionSection}>
            <p className={styles.defDescription}>{def.description}</p>
          </div>
        )}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'fields' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('fields')}
          >
            {fieldsTabLabel}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'json' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON
          </button>
        </div>
        {activeTab === 'fields' ? (
          <NiceView def={def} />
        ) : (
          <JsonView highlightedJson={highlightedJson} />
        )}
      </div>
    </details>
  )
}

function JsonView({ highlightedJson }: { highlightedJson: string }) {
  return (
    <div
      className={styles.schema}
      dangerouslySetInnerHTML={{ __html: highlightedJson }}
    />
  )
}

function NiceView({ def }: { def: LexUserType }) {
  switch (def.type) {
    case 'object':
    case 'record':
      return <ObjectTypeView def={def} />
    case 'query':
      return <QueryTypeView def={def} />
    case 'procedure':
      return <ProcedureTypeView def={def} />
    case 'subscription':
      return <SubscriptionTypeView def={def} />
    case 'permission-set':
      return <PermissionSetTypeView def={def} />
    case 'string':
    case 'integer':
    case 'boolean':
    case 'bytes':
    case 'blob':
    case 'cid-link':
    case 'unknown':
    case 'array':
      return <ScalarTypeView def={def} />
    case 'token':
      return <TokenTypeView />
  }
}

function getTypeCategory(def: LexUserType): TypeCategory {
  switch (def.type) {
    case 'object':
    case 'record':
      return 'object'
    case 'query':
      return 'query'
    case 'procedure':
      return 'procedure'
    case 'subscription':
      return 'subscription'
    case 'permission-set':
      return 'permission-set'
    case 'string':
    case 'integer':
    case 'boolean':
    case 'bytes':
    case 'blob':
    case 'cid-link':
    case 'unknown':
    case 'array':
      return 'scalar'
    case 'token':
      return 'token'
  }
}
