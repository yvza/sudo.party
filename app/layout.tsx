// @ts-ignore
import type { Metadata } from 'next'
// @ts-ignore
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'
import { lang } from '@/lib/constants'

// 👇 normal import of a Client Component is allowed
import ClientProviders from '@/components/providers/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: lang.siteUrl,
  description: lang.slogan,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
