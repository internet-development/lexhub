import { codeToHtml } from 'shiki'
import styles from './CodeBlock.module.css'

interface CodeBlockProps {
  code: string
  lang?: string
  className?: string
}

export async function CodeBlock({
  code,
  lang = 'text',
  className,
}: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme: 'github-light',
  })

  return (
    <div
      className={`${styles.codeBlock} ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
