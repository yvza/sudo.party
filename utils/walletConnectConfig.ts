import { http, createConfig, injected } from 'wagmi'
import { base, mainnet, optimism } from 'wagmi/chains'
import { metaMask, safe, walletConnect } from 'wagmi/connectors'

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

export const configX = createConfig({
  chains: [mainnet, base, optimism],
  connectors: [
    injected(),
    walletConnect({ projectId: walletConnectProjectId }),
    metaMask(),
    safe(),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
})