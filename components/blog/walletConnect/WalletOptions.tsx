'use client'

import React, { useEffect, useState } from 'react'
import type { Connector } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Loader2Icon } from 'lucide-react'

interface WalletOptions {
  connector: Connector
  onClick: () => void
  isLoading: boolean
  isDisabled: boolean
}

export default function WalletOptions({ connector, onClick, isLoading, isDisabled = false }: WalletOptions) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <Button className="cursor-pointer" disabled={!ready || isDisabled} onClick={onClick}>
      {isLoading && <Loader2Icon className="animate-spin" />}
      {connector.name}
    </Button>
  )
}
