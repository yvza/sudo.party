import React from 'react'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'

export default function page() {
  const renderAbout = () => {
    return (
      <div className="mx-5 sm:mx-auto max-w-2xl text-justify">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-left">About sudo.party</h1>

        <p className="mb-4 leading-relaxed">
          Welcome to our platform dedicated to exploring the evolving landscape of <span className="font-semibold">cryptocurrency</span>, <span className="font-semibold">blockchain technology</span>, <span className="font-semibold">Web3 development</span>, <span className="font-semibold">programming</span>, <span className="font-semibold">engineering</span>, <span className="font-semibold">cybersecurity</span>, and <span className="font-semibold">technical insights</span>. We aim to provide thoughtful, well-researched content for both newcomers and seasoned professionals.
        </p>

        <p className="mb-4 leading-relaxed">
          Most of our content is freely accessible to all visitors. Some in-depth technical articles are available through our access pass system to maintain content quality and community focus. Feel free to reach out via <a href="https://fb.me/sudo.party" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">Facebook</a> if you have questions or would like to connect.
        </p>

        <p className="mb-4 leading-relaxed">
          All articles are carefully researched and written by our team, ensuring authentic, human-crafted content based on practical experience and thorough investigation.
        </p>

        <p className="mb-4 leading-relaxed">
          If you find our content valuable, your support helps us continue creating quality technical resources for the community.
        </p>

        {/* <p className='text-xs sm:text-base text-gray-600'>
          ETH: <a href='https://etherscan.io/address/0x44596abF3541CF677906A1303a15146ccF17a7dB' target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-mono">0x44596abF3541CF677906A1303a15146ccF17a7dB</a>
        </p> */}
      </div>
    )
  }

  return (
    <>
      <TopNav />
      <div className='mx-auto max-w-xl py-8'>
        {renderAbout()}
      </div>
      <BottomNav />
    </>
  )
}
