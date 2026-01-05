import clsx from '@/util/clsx'
import styles from '@/components/Readme.module.css'
import { ReadmeBody } from '@/components/ReadmeBody'

import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

export interface ReadmeProps {
  nsid: string
  type?: 'namespace' | 'lexicon'
  className?: string
}

export async function Readme({
  nsid,
  type = 'namespace',
  className,
}: ReadmeProps) {
  const markdown = await getReadmeMarkdown(nsid)
  if (!markdown) {
    return null
  }

  const html = await markdownToHtml(markdown)

  return (
    <section className={clsx(styles.section, className)}>
      <h2 className={styles.title}>README</h2>
      <ReadmeBody type={type} html={html} />
    </section>
  )
}

const READMES_DIR = join(process.cwd(), 'content', 'readmes')

/** Fetches the README markdown for a given namespace ID (nsid).
 * Returns null if the README file does not exist.
 */
async function getReadmeMarkdown(nsid: string): Promise<string | null> {
  const filePath = resolve(READMES_DIR, `${nsid}.md`)

  // Prevent path traversal attacks
  if (!filePath.startsWith(READMES_DIR + '/')) {
    throw new Error('Invalid NSID')
  }

  try {
    return await readFile(filePath, 'utf-8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}
