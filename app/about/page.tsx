import React from 'react'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import HeaderBrand from '@/components/HeaderBrand'

export default function page() {
  const renderAbout = () => {
    return (
      <div className="mx-5 sm:mx-auto max-w-2xl text-justify">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-left">Welcome to sudo.party! ☕</h1>

        <p className="mb-4">
          Hi everyone, welcome to <span className="font-bold">sudo.party</span>!
        </p>

        <p className="mb-4">
          Discover insightful content on <span className="font-bold">Cryptocurrency</span>, <span className="font-bold">Blockchain</span>, <span className="font-bold">Web3</span>, <span className="font-bold">Programming</span>, <span className="font-bold">Engineering</span>, <span className="font-bold">Exploit</span>, <span className="font-bold">Cyber Security</span>, and uncover some <span className="font-bold">Tips and Tricks</span> on our platform. To access exclusive articles, you&apos;ll need an access key. It&apos;s completely free, and you can request it directly from us on <a href="https://fb.me/yuza.go.id" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Facebook</a>. Just chat with us, and we&apos;ll guide you through a few quick questions. We&apos;ll reply as soon as possible, ensuring you get seamless access to our restricted content.
        </p>

        <p className="mb-4">
          While everything on <span className="font-bold">sudo.party</span> is freely accessible, certain articles are restricted based on your access pass, providing a personalized experience for our readers.
        </p>

        <p className="mb-4">
          Everything on this platform is based on personal research.
        </p>

        <p className="mb-4">
          Your contribution helps us keep the content flowing!
        </p>

        <p className='text-xs sm:text-base'>
          ETH: 0x44596abF3541CF677906A1303a15146ccF17a7dB
        </p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-xl py-0 sm:py-8'>
      <TopNav />
      {renderAbout()}
      <BottomNav />
    </div>
  )
}
