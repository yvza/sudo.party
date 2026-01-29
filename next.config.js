const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';

    // CSP policy - allows necessary resources for Web3 functionality
    // Note: 'unsafe-eval' required by Web3Modal/WalletConnect libraries
    const cspDirectives = [
      "default-src 'self'",
      // Scripts: self + inline + eval (required by Web3Modal) + analytics
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://*.vercel-scripts.com",
      // Styles: self + inline for styled-components/tailwind
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + common image hosts
      "img-src 'self' data: blob: https:",
      // Fonts: self + common font CDNs
      "font-src 'self' data:",
      // Connect: self + APIs for payments, blockchain, wallets, analytics
      "connect-src 'self' https://api.paymento.io https://*.alchemy.com wss://*.alchemy.com https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://relay.walletconnect.org wss://relay.walletconnect.org https://rpc.walletconnect.com https://verify.walletconnect.com https://explorer-api.walletconnect.com https://*.web3modal.org wss://*.web3modal.org https://*.web3modal.com wss://*.web3modal.com https://cloudflareinsights.com https://*.vercel-insights.com https://vitals.vercel-insights.com",
      // Frame ancestors: none (replaces X-Frame-Options)
      "frame-ancestors 'none'",
      // Frames: allow WalletConnect verify iframe + Web3Modal
      "frame-src 'self' https://verify.walletconnect.com https://*.walletconnect.com https://*.web3modal.org https://*.web3modal.com",
      // Base URI: self only
      "base-uri 'self'",
      // Form actions: self only
      "form-action 'self'",
      // Object/embed: none
      "object-src 'none'",
      // Upgrade insecure requests in production
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join('; ');

    const securityHeaders = [
      // Enforce HTTPS for 2 years
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      // Basic hardening
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // You're not embedding this app elsewhere
      { key: 'X-Frame-Options', value: 'DENY' },
      // Cut down powerful APIs
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), fullscreen=(self), browsing-topics=()' },
      // Content Security Policy
      { key: 'Content-Security-Policy', value: cspDirectives },
    ];
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  turbopack: {},
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dummyimage.com'
      },
    ],
  }
}

module.exports = withNextIntl(nextConfig)
