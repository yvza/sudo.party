import React from 'react'
import Image from 'next/image'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'

export default function Account() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  return (
    <div>
      {ensAvatar && <Image src={ensAvatar} alt="ENS Avatar" width={32} height={32} />}
      {address && <div>{ensName ? `${ensName} (${address})` : address}</div>}
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}
