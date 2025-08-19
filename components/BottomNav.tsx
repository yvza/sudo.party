import React from 'react'
import { lang } from '@/lib/constants'
import PoweredByVercel from './PoweredByVercel'

export default function BottomNav() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      className="mx-auto px-5 py-6 text-center sm:text-left text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-700 shadow-top-sm"
    >
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <span aria-label={`Copyright ${currentYear}`}>
          &copy; {currentYear} {lang.siteUrl}
        </span>

        {/* Signature line */}
        <div className="flex items-center gap-1">
          <span>
            Made with <span className="sr-only">love</span>
          </span>
          <span aria-hidden className="text-rose-500 dark:text-rose-400">♥</span>
          <span>and TypeScript.</span>
        </div>

        <PoweredByVercel />
      </div>
    </footer>
  )
}
