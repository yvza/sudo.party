import React from 'react'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import HeaderBrand from '@/components/HeaderBrand'

export default function page() {
  const renderPrivacyPolicy = () => {
    return <div className='mx-5 sm:mx-auto max-w-2xl text-justify'>
      <h1 className='text-3xl font-bold mb-4'>Privacy Policy for sudo.party</h1>

      <p className='mb-4'>At sudo.party, accessible from https://sudo.party, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by sudo.party and how we use it.</p>

      <p className='mb-4'>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.</p>

      <h2 className='text-2xl font-bold mb-2'>Log Files</h2>

      <p className='mb-4'>sudo.party follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services&apos; analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users&apos; movement on the website, and gathering demographic information.</p>

      <h2 className='text-2xl font-bold mb-2'>Cookies and Web Beacons</h2>

      <p className='mb-4'>Like any other website, sudo.party uses &quot;cookies&quot;. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users&apos; experience by customizing our web page content based on visitors&apos; browser type and/or other information.</p>

      <h2 className='text-2xl font-bold mb-2'>Privacy Policies</h2>

      <p className='mb-4'>You may consult this list to find the Privacy Policy for each of the advertising partners of sudo.party.</p>

      <p className='mb-4'>Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on sudo.party, which are sent directly to users&apos; browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.</p>

      <p className='mb-4'>Note that sudo.party has no access to or control over these cookies that are used by third-party advertisers.</p>

      <h2 className='text-2xl font-bold mb-2'>Third Party Privacy Policies</h2>

      <p className='mb-4'>sudo.party&apos;s Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options. </p>

      <p className='mb-4'>You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers&apos; respective websites.</p>

      <h2 className='text-2xl font-bold mb-2'>Children&apos;s Information</h2>

      <p className='mb-4'>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.</p>

      <p className='mb-4'>sudo.party does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.</p>

      <h2 className='text-2xl font-bold mb-2'>Online Privacy Policy Only</h2>

      <p className='mb-4'>This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in sudo.party. This policy is not applicable to any information collected offline or via channels other than this website.</p>

      <h2 className='text-2xl font-bold mb-2'>Consent</h2>

      <p className='mb-4'>By using our website, you hereby consent to our Privacy Policy and agree to its Disclaimer section.</p>

      <p>Last Updated: <span className='font-bold mb-2'>1 January 2024</span></p>
    </div>
  }
  return (
    <div className='mx-auto max-w-xl py-8'>
      <TopNav />
      <HeaderBrand />
      {renderPrivacyPolicy()}
      <BottomNav />
    </div>
  )
}
