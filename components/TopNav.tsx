'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { HamburgerMenuIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'

// --- match shadcn <Button> default sizing
const BTN_H = 'h-9'
const BTN_RADIUS = 'rounded-md'
const BTN_TXT = 'text-sm font-medium'

// Sword-glint skeleton that matches "Connect" width (no CLS)
function SiweButtonSkeleton() {
  return (
    <div
      className={`relative inline-flex ${BTN_H} ${BTN_RADIUS} items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-neutral-700 bg-slate-100/40 dark:bg-neutral-800/40 sheen`}
    >
      {/* Invisible label reserves the exact "Connect" width */}
      <span className={`${BTN_TXT} invisible px-4`}>Connect</span>

      <style jsx>{`
        /* LIGHT MODE: darker diagonal sweep so it’s noticeable on pale backgrounds */
        .sheen::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          bottom: -50%;
          left: -50%;
          /* center is a semi-transparent charcoal; edges fade to 0 */
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.28) 50%,
            rgba(0, 0, 0, 0) 100%
          );
          transform: rotateZ(60deg) translate(-6em, 9em);
          animation: sheen-sweep 0.3s linear infinite;
          will-change: transform;
          pointer-events: none;
          mix-blend-mode: multiply;   /* darken against light bg */
          opacity: 1;
          filter: blur(0.4px);
        }

        /* DARK MODE: bright cyan/white sweep so it pops on dark bg */
        :global(.dark) .sheen::after {
          background: linear-gradient(
            to bottom,
            rgba(134, 214, 255, 0) 0%,
            rgba(230, 251, 255, 0.9) 50%,
            rgba(134, 214, 255, 0) 100%
          );
          mix-blend-mode: screen;     /* lighten against dark bg */
          opacity: 0.85;
          filter: blur(0.6px);
        }

        @keyframes sheen-sweep {
          0%   { transform: rotateZ(60deg) translate(-6em, 9em); }
          100% { transform: rotateZ(60deg) translate(2em, -11em); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sheen::after { animation: none; }
        }
      `}</style>
    </div>
  )
}

const SiweConnectButton = dynamic(
  () => import('./blog/siwe/connect-button'),
  { ssr: false, loading: () => <SiweButtonSkeleton /> }
)

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

          {/* theme toggle — SSR-safe */}
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
