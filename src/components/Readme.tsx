import clsx from '@/common/clsx'
import styles from '@/components/Readme.module.css'

import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
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
const MISSING_README_PATH = join(READMES_DIR, '_missing.md')

/** Fetches the README content for a given namespace ID (nsid).
 * If the README file does not exist, it falls back to a default
 * "missing" README file.
 */
async function getReadmeContent(nsid: string): Promise<string> {
  const filePath = resolve(READMES_DIR, `${nsid}.md`)

  // Prevent path traversal attacks
  if (!filePath.startsWith(READMES_DIR + '/')) {
    throw new Error('Invalid NSID')
  }

  try {
    return await readFile(filePath, 'utf-8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return await readFile(MISSING_README_PATH, 'utf-8')
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
