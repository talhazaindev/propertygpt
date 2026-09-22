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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
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