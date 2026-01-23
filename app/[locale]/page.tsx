'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/lib/i18n-navigation'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'

const projects = [
  {
    name: 'Blog',
    description: 'Research, insights, and technical deep-dives on crypto, Web3, and beyond.',
    href: '/blog',
    icon: '📝',
    tag: 'Content',
    internal: true,
  },
  {
    name: 'Whales Tracker',
    description: 'On-chain market sentiment analysis tracking whale movements and smart money.',
    href: 'https://whales.sudo.party',
    icon: '🐋',
    tag: 'Analytics',
    internal: false,
  },
  {
    name: 'Crypto Sentiment',
    description: 'Real-time market sentiment data processing and analysis tools.',
    href: 'https://crypto-sentiment.sudo.party',
    icon: '📊',
    tag: 'Analytics',
    internal: false,
  },
  {
    name: 'Old Blog',
    description: 'Archived writings and early research from the beginning.',
    href: 'https://old.sudo.party',
    icon: '📜',
    tag: 'Archive',
    internal: false,
  },
  {
    name: 'Facebook',
    description: 'Community updates and discussions.',
    href: 'https://fb.me/sudo.party',
    icon: '📘',
    tag: 'Social',
    internal: false,
  },
]

const stats = [
  { label: 'Projects', value: '5+' },
  { label: 'Research Focus', value: 'Crypto & Web3' },
  { label: 'Status', value: 'Building' },
]

export default function Page() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Toggle theme"
        >
          {mounted && (
            resolvedTheme === 'dark'
              ? <SunIcon className="w-5 h-5" />
              : <MoonIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 pt-20 pb-16">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-white to-white dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950 -z-10" />

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Brand */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Building in public
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-300 dark:to-white bg-clip-text text-transparent">
              sudo.party
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Independent research on crypto, blockchain, and Web3.
            <span className="block mt-2 text-neutral-500 dark:text-neutral-500">
              Exploring the ecosystem, one project at a time.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/blog"
              className="px-6 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all hover:scale-105"
            >
              Explore Blog
            </Link>
            <a
              href="#projects"
              className="px-6 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
            >
              View Projects
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              The Ecosystem
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
              A collection of tools, research, and platforms built around crypto and Web3.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const CardWrapper = project.internal
                ? ({ children, className }: { children: React.ReactNode; className: string }) => (
                    <Link href={project.href} className={className}>{children}</Link>
                  )
                : ({ children, className }: { children: React.ReactNode; className: string }) => (
                    <a href={project.href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
                  )

              return (
                <CardWrapper
                  key={project.name}
                  className="group relative p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg dark:hover:shadow-neutral-900/50 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Tag */}
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {project.tag}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="text-4xl mb-4">{project.icon}</div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {project.name}
                    {!project.internal && (
                      <svg className="inline-block w-4 h-4 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Hover arrow */}
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardWrapper>
              )
            })}

            {/* Coming Soon Card */}
            <div className="relative p-6 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="text-4xl mb-4 opacity-50">🚀</div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-500 dark:text-neutral-500">
                More Coming Soon
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-600 leading-relaxed">
                New tools and research are always in the works. Stay tuned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            About
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
            Independent researcher and builder focused on crypto, blockchain technology, and the Web3 ecosystem.
            All content here is based on personal research and exploration.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://fb.me/sudo.party"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-white dark:hover:bg-neutral-800 transition-colors"
            >
              Facebook →
            </a>
            <Link
              href="/about"
              className="px-5 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-white dark:hover:bg-neutral-800 transition-colors"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-neutral-500 dark:text-neutral-500">
              © {new Date().getFullYear()} sudo.party. Independent research.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/disclaimer" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Disclaimer
              </Link>
              <Link href="/privacy_policy" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/blog" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Blog
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
