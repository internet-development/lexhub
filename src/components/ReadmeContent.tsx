'use server'

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

export interface ReadmeContentProps extends HTMLAttributes<HTMLElement> {
  nsid: string
}

export async function ReadmeContent(props: ReadmeContentProps) {
  const { nsid, className, ...restProps } = props

  const markdown = await getReadmeContent(nsid)
  if (!markdown) {
    return null
  }

  const html = await markdownToHtml(markdown)

  return (
    <article
      className={clsx(styles.content, className)}
      dangerouslySetInnerHTML={{ __html: html }}
      {...restProps}
    ></article>
  )
}

const READMES_DIR = join(process.cwd(), 'content', 'readmes')

/** Fetches the README content for a given namespace ID (nsid).
 * Returns null if the README file does not exist.
 */
async function getReadmeContent(nsid: string): Promise<string | null> {
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
