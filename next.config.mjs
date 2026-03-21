import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: standalone output disabled due to Windows symlink permission issues
  // output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true,
  },
}

const sentryConfig = {
  // Suppresses sourcemap upload warning during development (no SENTRY_AUTH_TOKEN)
  silent: !process.env.CI,
  // Disable source map upload unless in CI with auth token
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  webpack: {
    // Automatically instrument Next.js data fetching methods
    autoInstrumentServerFunctions: true,
  },
}

export default withSentryConfig(withPayload(nextConfig), sentryConfig)
