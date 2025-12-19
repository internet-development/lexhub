import clsx from '@/common/clsx'
import styles from '@/components/Readme.module.css'

import { readFile } from 'fs/promises'
import { join } from 'path'
import type { HTMLAttributes } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

const READMES_DIR = join(process.cwd(), 'content', 'readmes')

export interface ReadmeProps extends HTMLAttributes<HTMLElement> {
  nsid: string
}

export async function Readme(props: ReadmeProps) {
  const { nsid, className = '', ...restProps } = props

  const markdown = await getReadmeContent(nsid)
  if (!markdown) return null

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

async function getReadmeContent(nsid: string): Promise<string | null> {
  try {
    const filePath = join(READMES_DIR, `${nsid}.md`)
    return await readFile(filePath, 'utf-8')
  } catch {
    return null
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
