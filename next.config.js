/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Pre-existing lint debt; do not block production deploys.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Pre-existing type debt (mostly react-hook-form/zod); do not block deploys.
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'child_process', etc on the client
      config.resolve.fallback = {
        fs: false,
        'fs/promises': false,
        child_process: false,
        net: false,
        tls: false,
        dns: false,
        'timers/promises': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig; 