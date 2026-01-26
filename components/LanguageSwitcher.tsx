'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/lib/i18n-navigation'
import { useState, useRef, useEffect } from 'react'
import { locales } from '@/lib/i18n-config'
import { ID as IDFlag } from 'country-flag-icons/react/3x2'
import { US as USFlag } from 'country-flag-icons/react/3x2'
import { CN as CNFlag } from 'country-flag-icons/react/3x2'

const languages = [
  { code: 'id', name: 'Indonesia', Flag: IDFlag },
  { code: 'en', name: 'English', Flag: USFlag },
  { code: 'zh', name: '中文', Flag: CNFlag },
] as const

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find((l) => l.code === locale) || languages[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false)
      return
    }

    // next-intl's router.replace handles locale switching automatically
    // pathname from usePathname is already locale-stripped
    router.replace(pathname, { locale: newLocale as any })
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        aria-label="Select language"
      >
        <currentLang.Flag className="w-5 h-4" />
        <span className="hidden sm:inline text-neutral-700 dark:text-neutral-300">
          {currentLang.code.toUpperCase()}
        </span>
        <svg
          className={`w-3 h-3 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 rounded-lg border bg-white shadow-lg dark:bg-neutral-900 dark:border-neutral-800 z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLocale(lang.code)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                  lang.code === locale
                    ? 'bg-neutral-50 dark:bg-neutral-800/50 font-medium'
                    : ''
                }`}
              >
                <lang.Flag className="w-5 h-4" />
                <span className="text-neutral-700 dark:text-neutral-300">{lang.name}</span>
                {lang.code === locale && (
                  <svg
                    className="ml-auto w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
