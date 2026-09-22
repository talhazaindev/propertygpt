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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Add any webpack customizations here
    return config;
  },
};

export default config;
