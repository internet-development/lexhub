import clsx from '@/common/clsx'
import styles from '@/components/Readme.module.css'

import { readFile } from 'fs/promises'
import { join } from 'path'
import type { HTMLAttributes } from 'react'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

export interface ReadmeProps extends HTMLAttributes<HTMLElement> {
  nsid: string
}

export async function Readme(props: ReadmeProps) {
  const { nsid, className, ...restProps } = props

  const markdown = await getReadmeContent(nsid)
  const html = await markdownToHtml(markdown)

  return (
    <article className={clsx(styles.root, className)} {...restProps}>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}

const READMES_DIR = join(process.cwd(), 'content', 'readmes')
const MISSING_README_FILENAME = '_missing.md'

/** Fetches the README content for a given namespace ID (nsid).
 * If the README file does not exist, it falls back to a default
 * "missing" README file.
 */
async function getReadmeContent(nsid: string): Promise<string> {
  try {
    const filePath = join(READMES_DIR, `${nsid}.md`)
    return await readFile(filePath, 'utf-8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      const missingReadmePath = join(READMES_DIR, MISSING_README_FILENAME)
      return await readFile(missingReadmePath, 'utf-8')
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
