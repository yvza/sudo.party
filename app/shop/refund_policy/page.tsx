'use client'
import React from 'react'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import Link from 'next/link'
import { rootAppSocialLink } from '@/lib/constants'

export default function page() {
  return (
    <div className='m-5'>
      <Header />
      <div className='max-w-[32rem] text-justify m-auto'>
        <div className='text-center font-bold text-xl mb-6'>Refund Policy</div>
        <div className='font-bold text-lg'>Return & Exchanges</div>
        <div>
          At sudo.party, we specialize in digital products, including methods and automation tools (bots) focused on IT-related fields. Due to the nature of our products, each sale includes a complimentary one-time update for our automation tools after purchase. However, we do not accept returns or exchanges. Each product is thoroughly tested and verified to work as described on the date of the latest update.
          <br /><br />
          Please note that software lifecycles may require further updates as soon as the target platform has a new version. Users must purchase additional updates if needed beyond the complimentary one-time update.
          <br /><br />
        </div>
        <div className='font-bold text-lg'>Voting System</div>
        <div>
        Customers who have purchased our products can vote on whether the product is functioning correctly based on specific versions. The current total vote results are displayed on the product page, providing transparency on its performance across different versions. Please note that our voting system is still in development and will be fully implemented soon.
          <br /><br />
        </div>
        <div className='font-bold text-lg'>Contact Us</div>
        <div>
          For any inquiries or support, please reach out to us via our <Link className='text-blue-500 hover:text-blue-600' href={rootAppSocialLink[3].link}>Facebook Page</Link> chat.
          <br /><br />
          Thank you for your understanding and support.
        </div>
        Regards.
      </div>
      <Footer />
    </div>
  )
}
