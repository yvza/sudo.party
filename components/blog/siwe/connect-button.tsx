'use client'

import Dialog from '@/components/Dialog'
import { Button } from '@/components/ui/button'
import { showAlertDialog } from '@/lib/features/alertDialog/toggle'
import axios from 'axios'
axios.defaults.withCredentials = true
import React, { useEffect, useState, useId } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SiweMessage } from 'siwe'
import { useAccount, useConnect, useDisconnect, useSignMessage, useChainId, useConfig } from 'wagmi'
import { getAddress } from 'viem'
import { getAccount, getWalletClient } from '@wagmi/core'
import { siweVerifyRequested, logoutRequested, sessionHydrateRequested } from '@/lib/features/auth/slice'
// @ts-ignore
import dynamic from 'next/dynamic'
const WalletOptions = dynamic(() => import('../walletConnect/WalletOptions'), { ssr: false })
import { RootState } from '@/lib/store'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function SiweConnectButton() {
  const isLoggedIn = useSelector((s: RootState) => s.auth.isLoggedIn)
  const [remember, setRemember] = useState(true)
  const { address, isConnected, connector: activeConnector } = useAccount()
  const chainId = useChainId()
  const config = useConfig()
  const { signMessageAsync } = useSignMessage()
  const dispatch = useDispatch()
  const { connectors, connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const [isSigning, setIsSigning] = useState(false)

  const injectedList = connectors.filter((c) => c.type === 'injected')
  const walletConnectConn = connectors.find((c) => c.type === 'walletConnect')
  const injectedPreferred = connectors.find((c) => c.id === 'injected' || c.type === 'injected') ?? injectedList[0] ?? null

  useEffect(() => {
    dispatch(sessionHydrateRequested())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ConnectDialogContent = ({
    defaultRemember,
    onRememberChange,
  }: {
    defaultRemember: boolean
    onRememberChange: (v: boolean) => void
  }) => {
    const [connecting, setConnecting] = useState<null | 'browser' | 'mobile'>(null)
    const [rememberLocal, setRememberLocal] = useState<boolean>(defaultRemember)
    const rememberId = useId()

    useEffect(() => setRememberLocal(defaultRemember), [defaultRemember])

    return (
      <div className="flex gap-3 flex-col lg:flex-row justify-center flex-wrap mt-2">
        <div className="w-full flex items-center justify-center mb-1 gap-2 text-sm">
          <Checkbox
            id={rememberId}
            checked={rememberLocal}
            onCheckedChange={(v) => {
              const val = v === true
              setRememberLocal(val)
              onRememberChange(val)
            }}
          />
          <Label
            htmlFor={rememberId}
            className="cursor-pointer select-none"
            onClick={(e) => {
              e.preventDefault()
              const val = !rememberLocal
              setRememberLocal(val)
              onRememberChange(val)
            }}
          >
            Remember me (keep me signed in longer)
          </Label>
        </div>

        <WalletOptions
          key={injectedPreferred?.uid ?? 'injected'}
          connector={{ ...(injectedPreferred ?? ({} as any)), name: 'Browser wallet' } as any}
          isLoading={connecting === 'browser'}
          isDisabled={connecting != null}
          onClick={async () => {
            if (!injectedPreferred) return
            setConnecting('browser')
            try {
              if (isConnected && activeConnector?.id === injectedPreferred.id) {
                await doSiwe()
                return
              }
              if (isConnected && activeConnector?.id && activeConnector.id !== injectedPreferred.id) {
                await disconnectAsync()
              }
              const res = await connectAsync({ connector: injectedPreferred })
              const first = (res as any)?.accounts?.[0] as string | undefined
              await doSiwe(first)
            } catch (e: any) {
              if (e?.name === 'ConnectorAlreadyConnectedError') {
                await doSiwe()
                return
              }
              console.error('connect failed', e)
            } finally {
              setConnecting(null)
            }
          }}
        />

        {walletConnectConn && (
          <WalletOptions
            key={walletConnectConn.uid}
            connector={{ ...walletConnectConn, name: 'Mobile wallet' } as any}
            isLoading={connecting === 'mobile'}
            isDisabled={connecting != null}
            onClick={async () => {
              setConnecting('mobile')
              try {
                if (isConnected && activeConnector?.id === walletConnectConn.id) {
                  await doSiwe()
                  return
                }
                if (isConnected && activeConnector?.id && activeConnector.id !== walletConnectConn.id) {
                  await disconnectAsync()
                }
                const res = await connectAsync({ connector: walletConnectConn })
                const first = (res as any)?.accounts?.[0] as string | undefined
                await doSiwe(first)
              } catch (e: any) {
                if (e?.name === 'ConnectorAlreadyConnectedError') {
                  await doSiwe()
                  return
                }
                console.error('connect failed', e)
              } finally {
                setConnecting(null)
              }
            }}
          />
        )}
      </div>
    )
  }

  const onSignIn = () => {
    dispatch(showAlertDialog({
      show: true,
      title: 'Connect Wallet',
      description: () => (
        <ConnectDialogContent defaultRemember={remember} onRememberChange={setRemember} />
      ),
      onCancel: () => {},
    }))
  }

  const onLogout = async () => {
    await disconnectAsync()
    dispatch(logoutRequested())
  }

  const doSiwe = async (addrOverride?: string) => {
    try {
      if (isSigning) return
      let addrRaw = addrOverride ?? address

      if (!addrRaw) {
        const acct = getAccount(config)
        addrRaw = acct?.address
      }
      if (!addrRaw) {
        const wc = await getWalletClient(config, { chainId: chainId ?? undefined }).catch(() => null)
        addrRaw = wc?.account?.address as string | undefined
      }
      if (!addrRaw && activeConnector) {
        try {
          const provider: any = await activeConnector.getProvider()
          let accts: any[] | undefined = await provider.request?.({ method: 'eth_requestAccounts' }).catch(() => undefined)
          if (!accts || accts.length === 0) {
            accts = await provider.request?.({ method: 'eth_accounts' }).catch(() => undefined)
          }
          addrRaw = Array.isArray(accts) ? (accts[0] as string | undefined) : undefined
        } catch {}
      }

      if (!addrRaw) throw new Error('Wallet not connected')
      const addr = getAddress(addrRaw as `0x${string}`)

      setIsSigning(true)

      const { data: nonceResp } = await axios.get('/api/siwe/nonce', { withCredentials: true })
      const nonce: string = nonceResp?.nonce
      if (!nonce) throw new Error('Failed to get nonce')

      const message = new SiweMessage({
        domain: window.location.host,
        address: addr,
        statement: 'Sign in with Ethereum to sudo.party',
        uri: window.location.origin,
        version: '1',
        chainId: chainId ?? 1,
        nonce,
      }).prepareMessage()

      const signature = await signMessageAsync({ message })
      dispatch(siweVerifyRequested({ message, signature, remember, signedAt: Date.now() }))
    } catch (error) {
      console.error('Sign-in failed', error)
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <>
      {isLoggedIn
        ? <Button className="cursor-pointer" onClick={onLogout}>Disconnect</Button>
        : <Button className="cursor-pointer" onClick={onSignIn}>Connect</Button>}
      <Dialog />
    </>
  )
}
