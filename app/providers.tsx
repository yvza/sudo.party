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
          <ReactQueryDevtools initialIsOpen={false} />
        </PersistQueryClientProviderClient>
      </WagmiProvider>
    </Provider>
  )
}