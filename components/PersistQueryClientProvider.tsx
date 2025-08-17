'use client'

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/lib/store'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/react-query/client'

/** Minimal shape we use inside shouldDehydrateQuery */
type DehydrateCheck = {
  meta?: Record<string, unknown>
  queryKey?: readonly unknown[] | unknown[]
}

export default function PersistQueryClientProviderClient({ children }: { children: React.ReactNode }) {
  const epoch = useSelector((s: RootState) => s.auth.sessionEpoch)

  const [PersistProvider, setPersistProvider] = useState<null | React.ComponentType<any>>(null)
  const [persister, setPersister] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (typeof window === 'undefined') return
      const [{ PersistQueryClientProvider }, { createSyncStoragePersister }] = await Promise.all([
        import('@tanstack/react-query-persist-client'),
        import('@tanstack/query-sync-storage-persister'),
      ])
      if (!cancelled) {
        setPersistProvider(() => PersistQueryClientProvider as any)
        setPersister(
          createSyncStoragePersister({
            storage: window.localStorage,
            key: `rqcache:v5:epoch:${epoch}`,
          }),
        )
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [epoch])

  // SSR (and until dynamic imports finish): plain provider
  if (typeof window === 'undefined' || !PersistProvider || !persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return (
    <PersistProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 30, // 30 minutes
        dehydrateOptions: {
          shouldDehydrateQuery: (q: DehydrateCheck) => {
            if (q?.meta && (q.meta as any).persist === false) return false
            const root = Array.isArray(q?.queryKey) ? q!.queryKey![0] : undefined
            if (root === 'article') return false
            return true
          },
        },
      }}
    >
      {children}
    </PersistProvider>
  )
}
