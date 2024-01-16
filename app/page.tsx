'use client'
import React, { useState, useEffect } from 'react'

const Page = () => {
  const [currentDateTime, setCurrentDateTime] = useState(getFormattedDateTime())

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

  return (
    <section className='flex items-center justify-center flex-col h-full'>
      <header>
        <h5>sudo.party</h5>
        <h6>{currentDateTime} JKT/IDN</h6>
      </header>

      <main>
        <ul>
          <li>blog</li>
          <li>archived</li>
          <li>---</li>
          <li>---</li>
          <li>---</li>
        </ul>
      </main>
    </section>
  )
}

export default Page