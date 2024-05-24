'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import HeaderBrand from './HeaderBrand'
import { HamburgerMenuIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGlitch, GlitchHandle } from 'react-powerglitch'
import { getLight } from '@/lib/utils'
import { useTheme } from 'next-themes'

export default function TopNav() {
  const glitch: GlitchHandle = useGlitch()
  const [lightMode, setLightMode] = useState('')
  const { setTheme } = useTheme()

  useEffect(() => {
    setLightMode(getLight() as string)
  }, [])

  const renderLight = () => {
    if (!lightMode) return <></>

    return <>
      <div
        className='hover:cursor-pointer'
        onClick={() => {
          const storedLight = getLight() as string
          if (storedLight == 'light') {
            setLightMode('dark')
            setTheme('dark')
            return
          }
          setLightMode('light')
          setTheme('light')
        }}
      >
        {lightMode == 'light' ? <MoonIcon /> : <SunIcon />}
      </div>
    </>
  }

  return <>
      <div className='relative hidden sm:flex flex-col items-center sm:flex-row sm:justify-between'>
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
          <Separator orientation="vertical" />
          {renderLight()}
        </div>
      </div>

      <div className='relative flex justify-between items-center mx-5 pt-4 sm:hidden'>
        <HeaderBrand sloganOn={false} fontSize='text-3xl' ref={glitch.ref} />
        <div className='flex flex-row gap-8'>
          {renderLight()}
          <DropdownMenu>
            <DropdownMenuTrigger><HamburgerMenuIcon /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href='/disclaimer'>
                  <div>Disclaimer</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href='/privacy_policy'>
                  <div>Privacy Policy</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href='/about'>
                  <div>About</div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator className="mb-8 mt-4" />
    </>
}
