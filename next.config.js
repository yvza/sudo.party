/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const securityHeaders = [
      // Enforce HTTPS for 2 years
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      // Basic hardening
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // You’re not embedding this app elsewhere
      { key: 'X-Frame-Options', value: 'DENY' }, // (CSP frame-ancestors is stronger, set below)
      // Cut down powerful APIs
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), fullscreen=(self), browsing-topics=()' },
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

module.exports = nextConfig
