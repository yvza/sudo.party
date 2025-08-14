import { lang } from '@/lib/constants'
import { http, createConfig, injected } from 'wagmi'
import { base, mainnet, optimism } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

export const configX = createConfig({
  chains: [mainnet, base, optimism],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: lang.siteUrl,
        description: 'SUDOPARTY Blog',
        url: lang.siteFullUrl,
        icons: ['https://sudo.party/favicon.ico']
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
})