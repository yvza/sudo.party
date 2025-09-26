'use client'

import React, { useEffect, useState, useId } from 'react'
import axios from 'axios'
axios.defaults.withCredentials = true

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'

// ✅ use the local shadcn Dialog (NOT the global alert dialog)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useChainId,
  useConfig,
} from 'wagmi'
import { getAccount, getWalletClient } from '@wagmi/core'
import { getAddress } from 'viem'
import { SiweMessage } from 'siwe'

import {
  siweVerifyRequested,
  logoutRequested,
  sessionHydrateRequested,
} from '@/lib/features/auth/slice'

// dynamic wallet list
// @ts-ignore
import dynamic from 'next/dynamic'
import { SiweButtonSkeleton } from '@/components/TopNav'
const WalletOptions = dynamic(() => import('../walletConnect/WalletOptions'), { ssr: false })

function WalletBindingNotice() {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Please keep a secure backup of your wallet.</AlertTitle>
      <AlertDescription>
        <p><br /></p>
        <p>
          Coming soon: you’ll be able to link your unique SGB Code (e.g., SGB-YourUniqueId) in
          Settings. Once a code is linked to a wallet, it is permanently bound and cannot be reused
          or transferred. This binding will be required to obtain SGB membership on this site.
        </p>
      </AlertDescription>
    </Alert>
  )
}

export default function SiweConnectButton() {
  const isLoggedIn = useSelector((s: RootState) => s.auth.isLoggedIn)
  const sessionReady = useSelector((s: RootState) => s.auth.sessionReady)

  const dispatch = useDispatch()

  const [remember, setRemember] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // parent-level "connecting" so we can lock the Dialog while browser-connecting
  const [connecting, setConnecting] = useState<null | 'browser' | 'mobile'>(null)

  const { address, isConnected, connector: activeConnector, status } = useAccount()
  const chainId = useChainId()
  const config = useConfig()
  const { signMessageAsync } = useSignMessage()
  const { connectors, connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const [isSigning, setIsSigning] = useState(false)

  const injectedList = connectors.filter((c) => c.type === 'injected')
  const walletConnectConn = connectors.find((c) => c.type === 'walletConnect')
  const injectedPreferred =
    connectors.find((c) => c.id === 'injected' || c.type === 'injected') ?? injectedList[0] ?? null

  // hydrate auth exactly once per runtime
  useEffect(() => {
    const g = globalThis as any
    if (!g.__AUTH_HYDRATED_ONCE__) {
      g.__AUTH_HYDRATED_ONCE__ = true
      dispatch(sessionHydrateRequested())
    }
  }, [dispatch])

  const onSignIn = () => {
    // open local dialog (not the global alert dialog)
    setDialogOpen(true)
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
          let accts: any[] | undefined = await provider
            .request?.({ method: 'eth_requestAccounts' })
            .catch(() => undefined)
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
      // On success, you may want to close the dialog:
      // setDialogOpen(false)
      dispatch(siweVerifyRequested({ message, signature, remember, signedAt: Date.now() }))
    } catch (error) {
      console.error('Sign-in failed', error)
    } finally {
      setIsSigning(false)
    }
  }

  const ConnectDialogContent = ({
    defaultRemember,
    onRememberChange,
  }: {
    defaultRemember: boolean
    onRememberChange: (v: boolean) => void
  }) => {
    const [rememberLocal, setRememberLocal] = useState<boolean>(defaultRemember)
    const rememberId = useId()

    useEffect(() => setRememberLocal(defaultRemember), [defaultRemember])

    return (
      <div className="flex gap-3 flex-col lg:flex-row justify-center flex-wrap mt-2">
        <WalletBindingNotice />

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

        {/* Browser wallet — keep dialog OPEN and show loader */}
        <WalletOptions
          key={injectedPreferred?.uid ?? 'injected'}
          connector={{ ...(injectedPreferred ?? ({} as any)), name: 'Browser wallet' } as any}
          isLoading={connecting === 'browser'}
          isDisabled={connecting != null}
          onClick={async (e?: React.MouseEvent) => {
            e?.preventDefault()
            e?.stopPropagation()
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
              setConnecting(null) // leave dialog open; user can close manually
            }
          }}
        />

        {/* Mobile wallet — closing dialog is OK (QR flow) */}
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
                // (optional) close before QR
                setDialogOpen(false)
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

  // ---------------------------
  // RENDER GATE (no flicker, keep dialog during connect)
  // ---------------------------

  // Hide only on the very first load while Redux session is hydrating
  // (and the dialog isn't open), or during background reconnects when
  // the dialog isn't open. Do NOT hide when status === 'connecting'
  // because that's the user-triggered Browser-wallet flow where we want
  // the dialog to stay visible and show the loader.
  const initialHydrating = !sessionReady && !dialogOpen
  const reconnectSettling = status === 'reconnecting' && !dialogOpen

  if (initialHydrating || reconnectSettling) {
    return <SiweButtonSkeleton />
  }

  return (
    <>
      {isLoggedIn ? (
        <Button className="cursor-pointer" onClick={onLogout}>
          Disconnect
        </Button>
      ) : (
        <>
          <Button className="cursor-pointer" onClick={onSignIn}>
            Connect
          </Button>

          {/* Local, controlled connect dialog */}
          <Dialog
            open={dialogOpen}
            onOpenChange={(next) => {
              // Prevent closing while browser-connecting
              if (connecting === 'browser' && next === false) return
              setDialogOpen(next)
            }}
          >
            <DialogContent
              // Prevent close via outside click or Esc while browser-connecting
              onPointerDownOutside={connecting === 'browser' ? (ev) => ev.preventDefault() : undefined}
              onEscapeKeyDown={connecting === 'browser' ? (ev) => ev.preventDefault() : undefined}
            >
              <DialogHeader>
                <DialogTitle>Connect Wallet</DialogTitle>
                <DialogDescription className="sr-only">
                  Choose a wallet to authenticate with SIWE.
                </DialogDescription>
              </DialogHeader>

              <ConnectDialogContent
                defaultRemember={remember}
                onRememberChange={setRemember}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button className='cursor-pointer' variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}
