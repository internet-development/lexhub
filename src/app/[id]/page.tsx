import { LexiconPage } from '@/components/LexiconPage'
import { NamespacePage } from '@/components/NamespacePage'
import { NamespaceTree } from '@/components/NamespaceTree'
import {
  getLexiconByNsid,
  getNamespaceData,
  getTreeData,
  hasLexiconsUnderPrefix,
} from '@/db/queries'
import { isValidNamespacePrefix } from '@/util/nsid'
import { isValidNsid } from '@atproto/syntax'
import { notFound } from 'next/navigation'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  // Case 1: Valid NSID - check for lexicon document
  if (isValidNsid(id)) {
    const lexicon = await getLexiconByNsid(id)

    if (lexicon) {
      // Render lexicon document page
      const treeData = await getTreeData(id, lexicon)
      return (
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <NamespaceTree {...treeData} subjectPath={id} />
          </aside>
          <main className={styles.main}>
            <LexiconPage lexicon={lexicon} />
          </main>
        </div>
      )
    }

    // NSID is valid but no lexicon - check if it's a namespace with children
    const hasChildren = await hasLexiconsUnderPrefix(id)
    if (hasChildren) {
      const [treeData, namespaceData] = await Promise.all([
        getTreeData(id, null),
        getNamespaceData(id),
      ])
      return (
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <NamespaceTree {...treeData} subjectPath={id} />
          </aside>
          <main className={styles.main}>
            <NamespacePage prefix={id} {...namespaceData} />
          </main>
        </div>
      )
    }
  }

  // Case 2: Valid namespace prefix (2+ segments, not a full NSID)
  if (isValidNamespacePrefix(id) && !isValidNsid(id)) {
    const hasChildren = await hasLexiconsUnderPrefix(id)
    if (hasChildren) {
      const [treeData, namespaceData] = await Promise.all([
        getTreeData(id, null),
        getNamespaceData(id),
      ])
      return (
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <NamespaceTree {...treeData} subjectPath={id} />
          </aside>
          <main className={styles.main}>
            <NamespacePage prefix={id} {...namespaceData} />
          </main>
        </div>
      )
    }
  }

  // No valid lexicon or namespace found
  notFound()
}
