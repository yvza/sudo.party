/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
}

module.exports = nextConfig
