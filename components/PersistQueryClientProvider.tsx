'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/lib/store'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { queryClient } from '@/lib/react-query/client'

export default function PersistQueryClientProviderClient({ children }: { children: React.ReactNode }) {
  const epoch = useSelector((s: RootState) => s.auth.sessionEpoch)

  const persister = useMemo(
    () =>
      createSyncStoragePersister({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        key: 'rq-cache',
      }),
    []
  )

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: `epoch:${epoch}`,     // reset persisted cache when auth changes
        maxAge: 1000 * 60 * 30,       // 30 minutes
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => {
            if (q.meta?.persist === false) return false
            const root = Array.isArray(q.queryKey) ? q.queryKey[0] : undefined
            if (root === 'article') return false  // don’t persist single-post payloads
            return true
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}