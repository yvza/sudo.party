import React, { useEffect, useState } from 'react'
import { Connector } from 'wagmi'
import { Button } from '@/components/ui/button'

interface WalletOptions {
  connector: Connector
  onClick: () => void
}

export default function WalletOptions({
  connector,
  onClick,
}: WalletOptions) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <Button className='cursor-pointer' disabled={!ready} onClick={onClick}>
      {connector.name}
    </Button>
  )
}
