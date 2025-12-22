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
  type?: 'namespace' | 'lexicon'
}

export async function Readme(props: ReadmeProps) {
  const { nsid, type = 'namespace', className, ...restProps } = props

  const markdown = await getReadmeContent(nsid, type)
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

const MISSING_README_MESSAGES = {
  namespace:
    'This namespace does not have a README file. You can add one by opening a PR [here](#).',
  lexicon:
    'This lexicon does not have a README file. You can add one by opening a PR [here](#).',
}

/** Fetches the README content for a given namespace ID (nsid).
 * If the README file does not exist, it falls back to a default
 * "missing" README message based on the type.
 */
async function getReadmeContent(
  nsid: string,
  type: 'namespace' | 'lexicon'
): Promise<string> {
  const filePath = resolve(READMES_DIR, `${nsid}.md`)

  // Prevent path traversal attacks
  if (!filePath.startsWith(READMES_DIR + '/')) {
    throw new Error('Invalid NSID')
  }

  try {
    return await readFile(filePath, 'utf-8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return MISSING_README_MESSAGES[type]
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
