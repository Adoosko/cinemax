import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    ppr: 'incremental',
    useCache: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*', // Allow images from all domains
      },
    ],
  },
};

export default nextConfig;
