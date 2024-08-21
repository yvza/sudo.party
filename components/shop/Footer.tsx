import React from 'react'
import Link from 'next/link'
import { lang } from '@/lib/constants'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  return (
    <div id="footer" className='text-center mt-7 flex flex-col gap-1'>
      <Link
        href='/shop/refund_policy'
        className={`font-medium ${pathname == '/shop/refund_policy' && 'hidden'}`}
      >
        Refund Policy
      </Link>
      <div className='font-light'>{lang.poweredByVercelPlusXendit}</div>
    </div>
  )
}
