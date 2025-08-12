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

  useEffect(() => {
    if (triggerSiwe) {
      console.log('asdasdas') // track this
      doSiwe()
    }
  }, [triggerSiwe])

  const onSignIn = () => {
    dispatch(showAlertDialog({
      show: true,
      title: 'Connect Wallet',
      description: () => {
        return <div className='flex gap-3 flex-row justify-center flex-wrap mt-2'>
          {connectors.map((connector) => (
            <WalletOptions
              key={connector.uid}
              connector={connector}
              onClick={() => connect({ connector}, { onSuccess: (res) => {
                console.log('onSuccess', res, authenticated)
                if (res.accounts.length !== 0 && !authenticated) setTriggerSiwe(true)
              }})}
            />
          ))}
        </div>
      },
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
      return <Button onClick={() => onLogout()}>Disconnect</Button>
    }

    return <Button onClick={() => onSignIn()}>Connect</Button>
  }

  return (
    <>
      {renderButton()}
      <Dialog />
    </>
  )
}
