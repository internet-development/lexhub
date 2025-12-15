import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: [
    'pino',
    'thread-stream',
    '@atproto/common',
    '@atproto/lexicon-resolver',
  ],
}

export default nextConfig
