'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { lang, rootAppSocialLink } from '@/lib/constants'
import { useRouter } from 'next/navigation'

const Page = () => {
  const [currentDateTime, setCurrentDateTime] = useState(() => getFormattedDateTime())
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/shop')
    router.prefetch('/blog')
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(getFormattedDateTime())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  function getFormattedDateTime() {
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    const formattedTime = formatTime(currentDate);

    return `${formattedDate} ${formattedTime}`;
  }

  function formatDate(date: Date) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed
    const year = date.getFullYear();

    return `${padZero(day)}/${padZero(month)}/${year}`;
  }

  function formatTime(date: Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const period = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format

    return `${padZero(formattedHours)}:${padZero(minutes)}${period}`;
  }

  function padZero(number: number) {
    return number < 10 ? `0${number}` : number;
  }

  function renderSocialLink() {
    return rootAppSocialLink.map((data, index) => (
      <li key={index} className='mb-4 w-fit hover:bg-red-500 hover:text-black'>
        <Link href={data.link}>{data.name}</Link>
      </li>
    ))
  }

  return (
    <section className='flex items-center justify-center flex-col h-screen bg-black text-white font-front-page text-xs'>
      <section>
        <header>
          <h5>{lang.siteUrl}</h5>
          <h6>{currentDateTime} {lang.idn}</h6>
        </header>

        <main className='mt-16 ml-4'>
          <ul>
            {renderSocialLink()}
          </ul>
        </main>
      </section>
    </section>
  )
}

export default Page