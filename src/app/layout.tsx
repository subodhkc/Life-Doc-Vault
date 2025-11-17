import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Life-Doc-Vault - Secure Personal Document Management',
  description: 'Secure SaaS application for managing personal documents and generating professional evidence packets',
  keywords: ['document management', 'evidence packets', 'document storage', 'AI document analysis'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
