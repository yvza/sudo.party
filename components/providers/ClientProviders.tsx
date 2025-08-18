'use client'

import * as React from 'react'
import Providers from '@/app/providers'
import { ThemeProvider } from '@/app/theme'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </Providers>
  )
}
