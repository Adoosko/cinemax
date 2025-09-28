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
    // Enable partial prerendering for instant loading
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    // Optimize bundle splitting
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-button'],
    // Server-side optimization
    serverMinification: true,
  },

  // Compress responses for better performance
  compress: true,

  // Image optimization for Netflix-grade performance
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*', // Allow images from all domains
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600, // 1 hour cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Optimize for different screen sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // SWC minification is enabled by default in Next.js 15

  // Headers for performance
  async headers() {
    return [
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Enable performance optimizations in webpack config if needed
  // This can be extended for custom bundle splitting or analysis

  // Output configuration

  // Power of 2 for better performance
  poweredByHeader: false,

  // Optimize for production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
