import Dialog from '@/components/Dialog'
import { Button } from '@/components/ui/button'
import { hideAlertDialog, showAlertDialog } from '@/lib/features/alertDialog/toggle'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { generateNonce, SiweMessage } from 'siwe'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import WalletOptions from '../walletConnect/WalletOptions'

export default function SiweConnectButton() {
  const [authenticated, setAuthenticated] = useState(false)
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const dispatch = useDispatch()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [triggerSiwe, setTriggerSiwe] = useState(false)
  // group: pick ONE injected, ONE walletconnect
  const injectedList = connectors.filter((c) => c.type === 'injected')
  const walletConnectConn = connectors.find((c) => c.type === 'walletConnect')
  // Prefer MetaMask if present, else first injected
  const injectedPreferred =
    injectedList.find((c) => /metamask/i.test(c.name)) ??
    injectedList[0] ??
    null

  useEffect(() => {
    if (triggerSiwe) {
      doSiwe()
    }
  }, [triggerSiwe])

  const onSignIn = () => {
    dispatch(showAlertDialog({
      show: true,
      title: 'Connect Wallet',
      description: () => (
        <div className="flex gap-3 flex-col lg:flex-row justify-center flex-wrap mt-2">
          {/* Browser wallet (all extensions) */}
          <WalletOptions
            key={injectedPreferred?.uid ?? 'injected'}
            connector={{
              // pass through the selected connector object
              ...injectedPreferred!,
              // but normalize the label shown in your WalletOptions
              name: 'Browser wallet', // ✅ single button label
            }}
            onClick={() => injectedPreferred && connect(
              { connector: injectedPreferred },
              {
                onSuccess: (res) => {
                  console.log('onSuccess', res, authenticated)
                  if (res.accounts.length !== 0 && !authenticated) setTriggerSiwe(true)
                }
              }
            )}
          />
          {/* Mobile wallet (WalletConnect) */}
          {walletConnectConn && (
            <WalletOptions
              key={walletConnectConn.uid}
              connector={{ ...walletConnectConn, name: 'Mobile wallet' }} // ✅ normalize label
              onClick={() => connect(
                { connector: walletConnectConn },
                {
                  onSuccess: (res) => {
                    console.log('onSuccess', res, authenticated)
                    if (res.accounts.length !== 0 && !authenticated) setTriggerSiwe(true)
                  }
                }
              )}
            />
          )}
        </div>
      ),
      onCancel: () => {
        console.log('exit')
      }
    }))
  }

  const onLogout = () => {
    disconnect()
    setAuthenticated(false)
    setTriggerSiwe(false)
  }

  const doSiwe = async () => {
    try {
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to this app.",
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce: generateNonce(),
      })

      const signedMessage = await signMessageAsync({ message: message.prepareMessage() })

      const response = await axios.post("/api/siwe", { message: message.prepareMessage(), signature: signedMessage })

      console.log('siwe ok, ', response)
      if (response.data.success) {
        setAuthenticated(true)
        dispatch(hideAlertDialog())
      }
    } catch (error) {
      console.error("Sign-in failed", error)
    }
  }

  const renderButton = () => {
    if (authenticated) {
      return <Button className='cursor-pointer' onClick={() => onLogout()}>Disconnect</Button>
    }

    return <Button className='cursor-pointer' onClick={() => onSignIn()}>Connect</Button>
  }

  return (
    <>
      {renderButton()}
      <Dialog />
    </>
  )
}
