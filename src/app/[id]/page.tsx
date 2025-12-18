import { notFound } from 'next/navigation'
import { isValidNsid } from '@atproto/syntax'
import {
  getLexiconByNsid,
  getTreeData,
  getNamespaceData,
  hasLexiconsUnderPrefix,
  type TreeData,
} from '@/db/queries'
import { isValidNamespacePrefix } from '@/util/nsid'
import { LexiconPage } from '@/components/LexiconPage'
import { NamespacePage } from '@/components/NamespacePage'
import { NamespaceTree } from '@/components/NamespaceTree'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

function PageLayout({
  id,
  treeData,
  children,
}: {
  id: string
  treeData: TreeData
  children: React.ReactNode
}) {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <NamespaceTree {...treeData} subjectPath={id} />
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  )
}

async function renderPage(id: string): Promise<React.ReactNode | null> {
  // Check for lexicon document first
  if (isValidNsid(id)) {
    const lexicon = await getLexiconByNsid(id)
    if (lexicon) {
      const treeData = await getTreeData(id, lexicon)
      return (
        <PageLayout id={id} treeData={treeData}>
          <LexiconPage lexicon={lexicon} />
        </PageLayout>
      )
    }
  }

  // Check for namespace prefix
  const isValidPath = isValidNsid(id) || isValidNamespacePrefix(id)
  if (!isValidPath) return null

  const hasChildren = await hasLexiconsUnderPrefix(id)
  if (!hasChildren) return null

  const [treeData, { children }] = await Promise.all([
    getTreeData(id, null),
    getNamespaceData(id),
  ])

  return (
    <PageLayout id={id} treeData={treeData}>
      <NamespacePage prefix={id} children={children} />
    </PageLayout>
  )
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const content = await renderPage(id)

  if (!content) {
    notFound()
  }

  return content
}
