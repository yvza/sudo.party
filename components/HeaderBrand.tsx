import React, { forwardRef } from 'react'
import { lang } from '@/lib/constants'
import Link from 'next/link'
import localFont from 'next/font/local'

const honkFont = localFont({ src: '../app/fonts/Honk-Regular.ttf' })

interface headerBrandProps {
  fontSize?: string,
  sloganOn?: boolean,
  hideOnMobile?: boolean
}

const HeaderBrand = forwardRef<HTMLDivElement, headerBrandProps>(({
  fontSize = 'text-5xl',
  sloganOn = true,
  hideOnMobile = false
}, ref) => {
  return (
    <Link href='/blog'>
      <header ref={ref} className={`flex-col items-center ${hideOnMobile && 'hidden sm:flex'}`}>
        <h1 className={`text-center ${fontSize} font-black ${honkFont.className}`}>{lang.siteUrl}</h1>
        {sloganOn && <h5 className="mb-8">{lang.slogan}</h5>}
      </header>
    </Link>
  )
})

HeaderBrand.displayName = 'HeaderBrand'

export default HeaderBrand;