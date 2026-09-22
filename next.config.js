/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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