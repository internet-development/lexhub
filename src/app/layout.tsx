import './reset.css'
import './globals.css'

import type { Metadata } from 'next'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'LexHub',
  description: 'ATProto lexicon explorer',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </body>
    </html>
  )
}
