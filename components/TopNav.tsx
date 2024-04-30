import React from 'react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function TopNav() {
  return <>
      <div className='flex flex-col items-center sm:flex-row sm:justify-between'>
        <div className='hidden sm:block'>
          <Link href="/blog">
            <Avatar className='hover:rotate-[360deg] transition duration-300 ease-in'>
              <AvatarImage src="/pixelated.jpg" alt="sudo.party" />
              <AvatarFallback>??</AvatarFallback>
            </Avatar>
          </Link>
        </div>
        <div className="flex h-5 items-center space-x-4 text-sm mt-2 sm:mt-0">
          <Link href='/disclaimer'>
            <div>Disclaimer</div>
          </Link>
          <Separator orientation="vertical" />
          <Link href='/privacy_policy'>
            <div>Privacy Policy</div>
          </Link>
          <Separator orientation="vertical" />
          <Link href='/about'>
            <div>About</div>
          </Link>
        </div>
      </div><Separator className="mb-8 mt-4" />
    </>
}
