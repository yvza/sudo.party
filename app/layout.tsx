import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { lang } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: lang.siteUrl,
  description: lang.slogan,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
