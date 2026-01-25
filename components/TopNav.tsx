'use client'

import React, { useEffect, useState } from 'react'
import { Link, usePathname } from '@/lib/i18n-navigation'
import { HamburgerMenuIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import SiweConnectButton from './blog/siwe/connect-button'
import LanguageSwitcher from './LanguageSwitcher'

// Kept for backwards compatibility
export function SiweButtonSkeleton() {
  return null
}

export default function TopNav() {
  const pathName = usePathname()
  const { setTheme, resolvedTheme } = useTheme()

  // sticky-on-scroll affordance
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const isActive = (href: string) => pathName === href
  const linkBase = 'text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 dark:focus-visible:ring-zinc-500 focus-visible:rounded-sm'
  const linkRest = 'text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 decoration-2 decoration-slate-400/70 dark:text-zinc-300 dark:hover:text-zinc-50 dark:decoration-zinc-400/60'
  const linkActive = 'font-semibold text-slate-900 dark:text-white underline decoration-emerald-500/80 dark:decoration-emerald-400/80 underline-offset-4'

  return (
    <div
      className={`sticky top-0 z-50 transition-shadow ${
        scrolled
          ? 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-slate-200 dark:border-neutral-700 shadow-sm'
          : 'bg-white dark:bg-neutral-900'
      }`}
    >
      {/* desktop */}
      <div className="p-5 relative hidden sm:flex flex-col items-center sm:flex-row sm:justify-between max-w-5xl mx-auto">
        <div className="hidden sm:block">
          <Link href="/blog" className="group">
            <div className="transition-colors">
              <span className="font-black text-slate-900 dark:text-slate-100">SUDOPARTY</span>{' '}
              <span className="font-medium text-slate-500 dark:text-slate-300">Blog</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6 text-sm mt-2 sm:mt-0">
          <Link href="/disclaimer">
            <div className={`${linkBase} ${isActive('/disclaimer') ? linkActive : linkRest}`}>Disclaimer</div>
          </Link>
          <Link href="/privacy_policy">
            <div className={`${linkBase} ${isActive('/privacy_policy') ? linkActive : linkRest}`}>Privacy Policy</div>
          </Link>
          <Link href="/about">
            <div className={`${linkBase} ${isActive('/about') ? linkActive : linkRest}`}>About</div>
          </Link>
          <Link href="/blog/support">
            <div className={`${linkBase} ${isActive('/blog/support') ? linkActive : linkRest}`}>Support</div>
          </Link>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* theme toggle — SSR-safe */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-slate-200"
          >
            <SunIcon className="hidden dark:inline-block" />
            <MoonIcon className="inline-block dark:hidden" />
          </button>

          <div className="shrink-0">
            <SiweConnectButton />
          </div>
        </div>
      </div>

      {/* mobile */}
      <div className="relative flex justify-between items-center p-5 sm:hidden max-w-5xl mx-auto">
        <Link href="/blog" className="group">
          <div className="transition-colors">
            <span className="font-black text-slate-900 dark:text-slate-100">SUDOPARTY</span>{' '}
            <span className="font-medium text-slate-500 dark:text-slate-300">Blog</span>
          </div>
        </Link>

        <div className="flex flex-row gap-4 items-center">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-slate-200"
          >
            <SunIcon className="hidden dark:inline-block" />
            <MoonIcon className="inline-block dark:hidden" />
          </button>

          <div className="shrink-0">
            <SiweConnectButton />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:cursor-pointer">
              <HamburgerMenuIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href="/disclaimer">
                  <div className={`${linkBase} ${isActive('/disclaimer') ? linkActive : linkRest}`}>Disclaimer</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/privacy_policy">
                  <div className={`${linkBase} ${isActive('/privacy_policy') ? linkActive : linkRest}`}>
                    Privacy Policy
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/about">
                  <div className={`${linkBase} ${isActive('/about') ? linkActive : linkRest}`}>About</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/blog/support">
                  <div className={`${linkBase} ${isActive('/blog/support') ? linkActive : linkRest}`}>Support</div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
