import Dialog from '@/components/Dialog'
import { Button } from '@/components/ui/button'
import { showAlertDialog } from '@/lib/features/alertDialog/toggle'
import axios from 'axios'
axios.defaults.withCredentials = true
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SiweMessage } from 'siwe'
import { useAccount, useConnect, useDisconnect, useSignMessage, useChainId, useConfig } from 'wagmi'
import { getAddress } from 'viem'
import { getAccount, getWalletClient } from '@wagmi/core'
import { siweVerifyRequested, logoutRequested, sessionHydrateRequested } from '@/lib/features/auth/slice'
import WalletOptions from '../walletConnect/WalletOptions'
import { RootState } from '@/lib/store'

export default function SiweConnectButton() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn)
  const { address, isConnected, connector: activeConnector } = useAccount()
  const chainId = useChainId()
  const config = useConfig()
  const { signMessageAsync } = useSignMessage()
  const dispatch = useDispatch()
  const { connectors, connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const [isSigning, setIsSigning] = useState(false)

  // group: pick ONE injected, ONE walletconnect
  const injectedList = connectors.filter((c) => c.type === 'injected')
  const walletConnectConn = connectors.find((c) => c.type === 'walletConnect')
  const injectedPreferred =
    connectors.find((c) => c.id === 'injected' || c.type === 'injected') ??
    injectedList[0] ??
    null

  useEffect(() => {
    dispatch(sessionHydrateRequested())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dialog content owns its own "connecting" state so it re-renders while loading
  const ConnectDialogContent = () => {
    const [connecting, setConnecting] = useState<null | 'browser' | 'mobile'>(null)

    return (
      <div className="flex gap-3 flex-col lg:flex-row justify-center flex-wrap mt-2">
        {/* Browser wallet (all extensions) */}
        <WalletOptions
          key={injectedPreferred?.uid ?? 'injected'}
          connector={{ ...(injectedPreferred ?? ({} as any)), name: 'Browser wallet' }}
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

        {/* Mobile wallet (WalletConnect) */}
        {walletConnectConn && (
          <WalletOptions
            key={walletConnectConn.uid}
            connector={{ ...walletConnectConn, name: 'Mobile wallet' }}
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
      description: () => <ConnectDialogContent />,
      onCancel: () => {},
    }))
  }

  const onLogout = async () => {
    await disconnectAsync()
    dispatch(logoutRequested())
  }

  // Allow overriding the address with the one returned from connectAsync
  const doSiwe = async (addrOverride?: string) => {
    try {
      if (isSigning) return

      // Resolve address robustly to avoid races after connectAsync
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
          // request accounts (prompts if needed), fallback to eth_accounts
          let accts: any[] | undefined = await provider.request?.({ method: 'eth_requestAccounts' }).catch(() => undefined)
          if (!accts || accts.length === 0) {
            accts = await provider.request?.({ method: 'eth_accounts' }).catch(() => undefined)
          }
          addrRaw = Array.isArray(accts) ? (accts[0] as string | undefined) : undefined
        } catch {
          // ignore
        }
      }

      if (!addrRaw) throw new Error('Wallet not connected')

      // Normalize to EIP-55 checksum (throws if invalid)
      const addr = getAddress(addrRaw as `0x${string}`)

      setIsSigning(true)

      // 1) get nonce from server (stores it in iron-session)
      const { data: nonceResp } = await axios.get('/api/siwe/nonce', { withCredentials: true })
      const nonce: string = nonceResp?.nonce
      if (!nonce) throw new Error('Failed to get nonce')

      // 2) build SIWE message bound to domain, origin, chain, and nonce
      const message = new SiweMessage({
        domain: window.location.host,
        address: addr,
        statement: 'Sign in with Ethereum to sudo.party',
        uri: window.location.origin,
        version: '1',
        chainId: chainId ?? 1,
        nonce,
      }).prepareMessage()

      // 3) sign with the wallet
      const signature = await signMessageAsync({ message })

      // 4) saga: verify + store update
      dispatch(siweVerifyRequested({ message, signature }))
    } catch (error) {
      console.error('Sign-in failed', error)
    } finally {
      setIsSigning(false)
    }
  }

  const renderButton = () => {
    if (isLoggedIn) {
      return <Button className="cursor-pointer" onClick={onLogout}>Disconnect</Button>
    }
    return <Button className="cursor-pointer" onClick={onSignIn}>Connect</Button>
  }

  return (
    <>
      {renderButton()}
      <Dialog />
    </>
  )
}
