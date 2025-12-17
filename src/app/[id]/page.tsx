import { notFound } from 'next/navigation'
import { isValidNsid } from '@atproto/syntax'
import {
  getLexiconByNsid,
  getTreeData,
  getNamespaceData,
  hasLexiconsUnderPrefix,
  type LexiconDoc,
  type TreeData,
} from '@/db/queries'
import { isValidNamespacePrefix } from '@/util/nsid'
import { LexiconPage } from '@/components/LexiconPage'
import {
  NamespacePage,
  type NamespacePageProps,
} from '@/components/NamespacePage'
import { NamespaceTree } from '@/components/NamespaceTree'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

interface LayoutProps {
  id: string
  treeData: TreeData
  children: React.ReactNode
}

function PageLayout({ id, treeData, children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <NamespaceTree {...treeData} subjectPath={id} />
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  )
}

interface LexiconPageData {
  type: 'lexicon'
  lexicon: LexiconDoc
  treeData: TreeData
}

interface NamespacePageData {
  type: 'namespace'
  namespaceData: NamespacePageProps
  treeData: TreeData
}

type PageData = LexiconPageData | NamespacePageData

async function getPageData(id: string): Promise<PageData | null> {
  // Case 1: Valid NSID - check for lexicon document
  if (isValidNsid(id)) {
    const lexicon = await getLexiconByNsid(id)

    if (lexicon) {
      const treeData = await getTreeData(id, lexicon)
      return { type: 'lexicon', lexicon, treeData }
    }
  }

  // Case 2: Valid namespace prefix or NSID without a lexicon
  const isValidPath = isValidNsid(id) || isValidNamespacePrefix(id)
  if (!isValidPath) return null

  const hasChildren = await hasLexiconsUnderPrefix(id)
  if (!hasChildren) return null

  const [treeData, { children }] = await Promise.all([
    getTreeData(id, null),
    getNamespaceData(id),
  ])

  return {
    type: 'namespace',
    namespaceData: { prefix: id, children },
    treeData,
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const data = await getPageData(id)

  if (!data) {
    notFound()
  }

  if (data.type === 'lexicon') {
    return (
      <PageLayout id={id} treeData={data.treeData}>
        <LexiconPage lexicon={data.lexicon} />
      </PageLayout>
    )
  }

  return (
    <PageLayout id={id} treeData={data.treeData}>
      <NamespacePage {...data.namespaceData} />
    </PageLayout>
  )
}
