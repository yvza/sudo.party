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
import { getLight } from '@/utils/helper'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Button } from './ui/button'

export default function TopNav() {
  const [lightMode, setLightMode] = useState('')
  const { setTheme } = useTheme()
  const pathName = usePathname()

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

  const renderSiweButton = () => {
    return (
      <Button>Connect</Button>
    )
  }

  return <>
      <div className='p-5 relative hidden sm:flex flex-col items-center sm:flex-row sm:justify-between'>
        <div className='hidden sm:block'>
          <Link href="/blog">
            <div><span className='font-black'>SUDOPARTY</span> <span className='font-light text-slate-400'>Blog</span></div>
          </Link>
        </div>
        <div className="flex h-5 items-center space-x-6 text-sm mt-2 sm:mt-0">
          <Link href='/disclaimer'>
            <div className={`border-black dark:border-white hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-200/80 ${pathName == '/disclaimer' && 'dark:text-zinc-200/80 text-black border-b border-dotted'}`}>Disclaimer</div>
          </Link>
          <Link href='/privacy_policy'>
            <div className={`border-black dark:border-white hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-200/80 ${pathName == '/privacy_policy' && 'dark:text-zinc-200/80 text-black border-b border-dotted'}`}>Privacy Policy</div>
          </Link>
          <Link href='/about'>
            <div className={`border-black dark:border-white hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-200/80 ${pathName == '/about' && 'dark:text-zinc-200/80 text-black border-b border-dotted'}`}>About</div>
          </Link>
          {renderLight()}
          {renderSiweButton()}
        </div>
      </div>

      <div className='relative flex justify-between items-center p-5 sm:hidden'>
        <Link href="/blog">
          <div><span className='font-black'>SUDOPARTY</span> <span className='font-light text-slate-400'>Blog</span></div>
        </Link>
        <div className='flex flex-row gap-8'>
          {renderSiweButton()}
          {renderLight()}
          <DropdownMenu>
            <DropdownMenuTrigger><HamburgerMenuIcon /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href='/disclaimer'>
                  <div className={`dark:text-zinc-500 dark:hover:text-zinc-200/80 ${pathName == '/disclaimer' && 'dark:text-zinc-200/80'}`}>Disclaimer</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href='/privacy_policy'>
                  <div className={`dark:text-zinc-500 dark:hover:text-zinc-200/80 ${pathName == '/privacy_policy' && 'dark:text-zinc-200/80'}`}>Privacy Policy</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href='/about'>
                  <div className={`dark:text-zinc-500 dark:hover:text-zinc-200/80 ${pathName == '/about' && 'dark:text-zinc-200/80'}`}>About</div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
}
