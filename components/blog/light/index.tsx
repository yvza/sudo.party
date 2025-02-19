import React, { useEffect, useState } from 'react'
import { getLight } from '@/utils/helper'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'

export default function Light() {
  const [lightMode, setLightMode] = useState('')
  const { setTheme } = useTheme()

  useEffect(() => {
    setLightMode(getLight() as string)
  }, [])

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
