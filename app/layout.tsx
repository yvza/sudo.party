// @ts-ignore
import type { Metadata } from 'next'
// @ts-ignore
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

// 👇 normal import of a Client Component is allowed
import ClientProviders from '@/components/providers/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'sudo.party | Web3 Research, On-Chain Analytics & Crypto Insights',
    template: '%s | sudo.party',
  },
  description:
    'Independent creator building Web3 research tools, on-chain analytics, and blockchain insights. Explore whale tracking, crypto sentiment analysis, and technical deep-dives.',
  keywords: [
    'Web3 research',
    'on-chain analytics',
    'crypto sentiment',
    'whale tracking',
    'blockchain insights',
    'DeFi analysis',
    'smart money tracking',
  ],
  authors: [{ name: 'sudo.party' }],
  creator: 'sudo.party',
  metadataBase: new URL('https://sudo.party'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sudo.party',
    siteName: 'sudo.party',
    title: 'sudo.party | Web3 Research & On-Chain Analytics',
    description:
      'Research platforms, analytics tools, and insights across crypto, Web3, and blockchain. From whale tracking to market sentiment analysis.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'sudo.party - Web3 Research & Analytics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'sudo.party | Web3 Research & On-Chain Analytics',
    description:
      'Independent creator building Web3 research tools, on-chain analytics, and blockchain insights.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
