'use client'

import React, { useEffect, useState, useId, memo } from 'react'
import { api } from '@/utils/fetcher'

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

// Extracted and memoized component to prevent re-creation on every render
const WalletBindingNotice = memo(function WalletBindingNotice() {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Please keep a secure backup of your wallet.</AlertTitle>
      <AlertDescription>
        <p><br /></p>
        <p>
          Coming soon: you'll be able to link your unique SGB Code (e.g., SGB-YourUniqueId) in
          Settings. Once a code is linked to a wallet, it is permanently bound and cannot be reused
          or transferred. This binding will be required to obtain SGB membership on this site.
        </p>
      </AlertDescription>
    </Alert>
  )
})

// Extracted component props type
type ConnectDialogContentProps = {
  defaultRemember: boolean
  onRememberChange: (v: boolean) => void
  injectedPreferred: any
  walletConnectConn: any
  connecting: null | 'browser' | 'mobile'
  setConnecting: (v: null | 'browser' | 'mobile') => void
  isConnected: boolean
  activeConnector: any
  disconnectAsync: () => Promise<void>
  connectAsync: (args: { connector: any }) => Promise<any>
  doSiwe: (addrOverride?: string) => Promise<void>
  setDialogOpen: (v: boolean) => void
  isVerifying: boolean
}

// Extracted outside main component to prevent re-creation on every render
const ConnectDialogContent = memo(function ConnectDialogContent({
  defaultRemember,
  onRememberChange,
  injectedPreferred,
  walletConnectConn,
  connecting,
  setConnecting,
  isConnected,
  activeConnector,
  disconnectAsync,
  connectAsync,
  doSiwe,
  setDialogOpen,
  isVerifying,
}: ConnectDialogContentProps) {
  const [rememberLocal, setRememberLocal] = useState<boolean>(defaultRemember)
  const rememberId = useId()

  useEffect(() => setRememberLocal(defaultRemember), [defaultRemember])

  // Buttons should be disabled during connection OR after SIWE (verifying)
  const buttonsDisabled = connecting != null || isVerifying

  return (
    <div className="flex gap-3 flex-col lg:flex-row justify-center flex-wrap mt-2">
      <WalletBindingNotice />

      <div className="w-full flex items-center justify-center mb-1 gap-2 text-sm">
        <Checkbox
          id={rememberId}
          checked={rememberLocal}
          disabled={buttonsDisabled}
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
            if (buttonsDisabled) return
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
        isDisabled={buttonsDisabled}
        onClick={async (e?: React.MouseEvent) => {
          e?.preventDefault()
          e?.stopPropagation()
          if (!injectedPreferred || buttonsDisabled) return
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
          isDisabled={buttonsDisabled}
          onClick={async () => {
            if (buttonsDisabled) return
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
})

export default function SiweConnectButton() {
  const isLoggedIn = useSelector((s: RootState) => s.auth.isLoggedIn)
  const sessionReady = useSelector((s: RootState) => s.auth.sessionReady)

  const dispatch = useDispatch()

  const [remember, setRemember] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // parent-level "connecting" so we can lock the Dialog while browser-connecting
  const [connecting, setConnecting] = useState<null | 'browser' | 'mobile'>(null)

  // Track SIWE verification in progress (from sign to success/fail)
  const [isVerifying, setIsVerifying] = useState(false)

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

  // Hydrate auth once on mount
  useEffect(() => {
    const g = globalThis as any
    if (!g.__AUTH_HYDRATED_ONCE__) {
      g.__AUTH_HYDRATED_ONCE__ = true
      dispatch(sessionHydrateRequested())
    }
  }, [dispatch])

  // Clear verifying state when session becomes ready (login success)
  useEffect(() => {
    if (sessionReady && isLoggedIn) {
      setIsVerifying(false)
      setDialogOpen(false)
    }
  }, [sessionReady, isLoggedIn])

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

      const nonceResp = await api.get<{ nonce: string }>('/api/siwe/nonce')
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

      // Keep loading state until verification completes
      setIsVerifying(true)

      dispatch(siweVerifyRequested({ message, signature, remember, signedAt: Date.now() }))
    } catch (error) {
      console.error('Sign-in failed', error)
      setIsVerifying(false)
    } finally {
      setIsSigning(false)
    }
  }

  // ---------------------------
  // RENDER
  // ---------------------------

  // Loading state: during connection, signing, OR verification
  const isLoading = connecting !== null || isSigning || isVerifying

  return (
    <>
      {isLoggedIn ? (
        <Button className="cursor-pointer" onClick={onLogout} suppressHydrationWarning>
          <span suppressHydrationWarning>Disconnect</span>
        </Button>
      ) : (
        <>
          <Button className="cursor-pointer" onClick={onSignIn} suppressHydrationWarning>
            <span suppressHydrationWarning>Connect</span>
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
                injectedPreferred={injectedPreferred}
                walletConnectConn={walletConnectConn}
                connecting={connecting}
                setConnecting={setConnecting}
                isConnected={isConnected}
                activeConnector={activeConnector}
                disconnectAsync={disconnectAsync}
                connectAsync={connectAsync}
                doSiwe={doSiwe}
                setDialogOpen={setDialogOpen}
                isVerifying={isVerifying}
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
