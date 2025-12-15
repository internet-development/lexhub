import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  serverExternalPackages: [
    'pino',
    'thread-stream',
    '@atproto/common',
    '@atproto/lexicon-resolver',
  ],
}

export default nextConfig
