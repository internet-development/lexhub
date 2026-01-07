import { notFound } from 'next/navigation'
import { getPageData, type PageData } from './data'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Header from '@/components/Header'
import { LexiconPage } from '@/components/LexiconPage'
import { NamespacePage } from '@/components/NamespacePage'
import { NamespaceTree } from '@/components/NamespaceTree'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const data = await getPageData(id)

  if (!data) {
    notFound()
  }

  return (
    <PageLayout data={data}>
      {data.type === 'lexicon' ? (
        <LexiconPage lexicon={data.lexicon} />
      ) : (
        <NamespacePage prefix={data.prefix} children={data.children} />
      )}
    </PageLayout>
  )
}

function PageLayout({
  data,
  children,
}: {
  data: PageData
  children: React.ReactNode
}) {
  const path = data.type === 'lexicon' ? data.lexicon.id : data.prefix

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <NamespaceTree {...data.treeData} />
        </aside>
        <main className={styles.main}>
          <Breadcrumbs path={path} className={styles.breadcrumbs} />
          {children}
        </main>
      </div>
    </div>
  )
}
