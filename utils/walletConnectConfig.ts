import { lang } from '@/lib/constants'
import { http, createConfig, injected } from 'wagmi'            // ⬅️ remove createStorage
import { base, mainnet, optimism } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

// Build connector list differently for server vs client.
// On the server, DO NOT create the WalletConnect connector (it touches browser APIs indirectly).
const connectors =
  typeof window === 'undefined'
    ? [
        injected({ shimDisconnect: true }),
      ]
    : [
        injected({ shimDisconnect: true }),
        walletConnect({
          projectId: walletConnectProjectId,
          metadata: {
            name: lang.siteUrl,
            description: 'SUDOPARTY Blog',
            url: lang.siteFullUrl,
            icons: ['https://sudo.party/favicon.ico'],
          },
        }),
      ]

export const configX = createConfig({
  chains: [mainnet, base, optimism],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
  // Important: do NOT call createStorage on the server.
  // Let Wagmi use its internal no-op storage on SSR.
  storage: undefined,
  ssr: true,
})
