'use client'
import React, { useEffect, useState } from 'react'
// @ts-ignore -- Next types not loaded here; safe at runtime
import Link from 'next/link'
import { lang, rootAppSocialLink } from '@/lib/constants'
import { useRouter } from 'next/navigation'

// --- helpers outside the component so useEffect deps stay simple ---
function padZero(n: number) {
  return n < 10 ? `0${n}` : String(n)
}
function formatDate(date: Date) {
  const day = date.getDate()
  const month = date.getMonth() + 1 // 0-indexed
  const year = date.getFullYear()
  return `${padZero(day)}/${padZero(month)}/${year}`
}
function formatTime(date: Date) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? 'pm' : 'am'
  const formattedHours = hours % 12 || 12
  return `${padZero(formattedHours)}:${padZero(minutes)}${period}`
}
function getFormattedDateTime() {
  const now = new Date()
  return `${formatDate(now)} ${formatTime(now)}`
}

const Page = () => {
  const router = useRouter()
  const [currentDateTime, setCurrentDateTime] = useState(getFormattedDateTime())

  // Prefetch only existing routes
  useEffect(() => {
    router.prefetch('/blog')
  }, [router])

  // Tick every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(getFormattedDateTime())
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  function renderSocialLink() {
    return rootAppSocialLink.map((data, idx) => (
      <li key={idx} className="mb-4 w-fit hover:bg-red-500 hover:text-black">
        <Link href={data.link}>{data.name}</Link>
      </li>
    ))
  }

  return (
    <section className="flex items-center justify-center flex-col h-screen bg-black text-white font-front-page text-xs">
      <section>
        <header>
          <h5>{lang.siteUrl}</h5>
          <h6>
            {currentDateTime} {lang.idn}
          </h6>
        </header>

        <main className="mt-16 ml-4">
          <ul>{renderSocialLink()}</ul>
        </main>
      </section>
    </section>
  )
}

export default Page
