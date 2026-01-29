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

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
})

export const metadata: Metadata = {
  title: {
    default: 'sudo.party | Web3 Research, On-Chain Analytics & Crypto Insights',
    template: '%s | sudo.party',
  },
  description:
    'Web3 research, cybersecurity insights, and technical deep-dives. Covering blockchain analytics, exploit research, vulnerability analysis, and penetration testing.',
  keywords: [
    'Web3 research',
    'cybersecurity',
    'exploit research',
    'vulnerability analysis',
    'penetration testing',
    'blockchain analytics',
    'on-chain analytics',
    'crypto sentiment',
    'whale tracking',
    'security research',
  ],
  authors: [{ name: 'sudo.party' }],
  creator: 'sudo.party',
  metadataBase: new URL('https://sudo.party'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sudo.party',
    siteName: 'sudo.party',
    title: 'sudo.party | Web3 Research & Cybersecurity Insights',
    description:
      'Technical research covering Web3, blockchain analytics, cybersecurity, exploit analysis, and penetration testing.',
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
    title: 'sudo.party | Web3 Research & Cybersecurity Insights',
    description:
      'Web3 research, cybersecurity insights, exploit analysis, and technical deep-dives.',
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.paymento.io" />
        <link rel="dns-prefetch" href="https://api.web3modal.org" />
        <link rel="dns-prefetch" href="https://verify.walletconnect.com" />
      </head>
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
