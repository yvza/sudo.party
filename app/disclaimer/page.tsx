import React from 'react'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'

export default function page() {
  const renderDisclaimer = () => {
    return (
      <div className="mx-5 sm:mx-auto max-w-2xl text-justify">
        <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>

        <ul className="mb-4  pl-4 list-disc">
          <li className='mb-2'>
            All information available on this website is for educational purposes only and not intended for any illegal activities.
          </li>
          <li className='mb-2'>
            We do not assume responsibility for any misuse of the information provided.
          </li>
          <li className='mb-2'>
            We disclaim any liability for direct or indirect damages arising from the use of the information on this website.
          </li>
          <li className='mb-2'>
            This is not financial advice or a recommendation. Always do your own research and seek independent advice when necessary. Investing always carries risks.
          </li>
          <li className='mb-2'>
            Users (you) are entirely responsible for independently evaluating and comparing the information on this website. The impact of using this information is solely the user&apos;s responsibility. Kindly conduct your own research for a thorough understanding.
          </li>
        </ul>
      </div>
    )
  }
  return (
    <>
      <TopNav />
      <div className='mx-auto max-w-xl py-0 sm:py-8'>
        {renderDisclaimer()}
      </div>
      <BottomNav />
    </>
  )
}
