import BlueskyIcon from './icons/BlueskyIcon'
import GitHubIcon from './icons/GitHubIcon'

interface SocialLinksProps {
  size?: number
}

export default function SocialLinks({ size = 20 }: SocialLinksProps) {
  return (
    <>
      <a
        href="https://bsky.app"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bluesky"
      >
        <BlueskyIcon size={size} />
      </a>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <GitHubIcon size={size} />
      </a>
    </>
  )
}
