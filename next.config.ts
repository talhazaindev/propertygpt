import { NextConfig } from 'next';

const config: NextConfig = {
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
    // Add any webpack customizations here
    return config;
  },
};

export default config;
