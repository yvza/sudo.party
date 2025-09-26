'use client'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider } from 'react-redux'
import { store } from "../lib/store"
import { WagmiProvider } from "wagmi"
import PersistQueryClientProviderClient from "@/components/PersistQueryClientProvider"
import { configX } from "@/utils/walletConnectConfig"

export default function Providers({ children } : { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <WagmiProvider config={configX}>
        <PersistQueryClientProviderClient>
          {children}
          {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </PersistQueryClientProviderClient>
      </WagmiProvider>
    </Provider>
  )
}