import React from 'react'
import { lang } from '@/lib/constants'
import PoweredByVercel from './PoweredByVercel'

export default function BottomNav() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mx-auto px-5 py-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between text-center sm:text-left text-xs text-gray-500 dark:text-gray-400">
      <span aria-label={`Copyright ${currentYear}`}>
        &copy; {currentYear} {lang.siteUrl}
      </span>
      <PoweredByVercel />
    </footer>
  )
}
