import React from 'react'
import { lang } from '@/lib/constants'
import Link from 'next/link'
import localFont from 'next/font/local'

const honkFont = localFont({ src: '../app/fonts/Honk-Regular.ttf' })

interface headerBrandProps {
  fontSize?: string,
  sloganOn?: boolean
}

export default function HeaderBrand({
  fontSize = 'text-5xl',
  sloganOn = true
} : headerBrandProps) {
  return <>
    <Link href='/blog'>
      <header className="flex flex-col items-center">
        <h1 className={`text-center ${fontSize} font-black ${honkFont.className}`}>{lang.siteUrl}</h1>
        {sloganOn && <h5 className="mb-8">{lang.slogan}</h5>}
      </header>
    </Link>
  </>
}