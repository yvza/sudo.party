'use client'

import { createConfig, createStorage, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'

/** No-op storage for server (SSR) so nothing touches indexedDB/localStorage */
const memoryStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
}

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },

  // IMPORTANT: on server we force a no-op storage
  storage:
    typeof window === 'undefined'
      ? createStorage({ storage: memoryStorage as any })
      : undefined,

  ssr: true,
})
