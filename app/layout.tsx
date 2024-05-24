import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { lang } from '@/lib/constants';
import Providers from './providers';
import { ThemeProvider } from './theme';
import { getLight } from '@/lib/utils';

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
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Providers>
            <ThemeProvider
              attribute="class"
              defaultTheme={getLight()}
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </Providers>
          <Toaster />
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
  )
}
