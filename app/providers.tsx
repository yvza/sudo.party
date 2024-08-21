'use client'

import { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { Provider } from 'react-redux'
import { store } from "../lib/store"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24
    }
  }
})

const persister = createSyncStoragePersister({
  storage:typeof window !== 'undefined' ? window.localStorage : null,
  key: 'SUDOPARTY_OFFLINE_CACHE'
})

export default function Providers({ children } : { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </Provider>
  )
}