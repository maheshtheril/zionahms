/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  async redirects() {
    return [
      {
        source: '/dashboard/rbac/users',
        destination: '/settings/users',
        permanent: true,
      },
      {
        source: '/dashboard/rbac/roles',
        destination: '/settings/roles',
        permanent: true,
      },
      {
        source: '/hms/inventory/operations/receive',
        destination: '/hms/purchasing/receipts/new',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  compress: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'framer-motion'],
  },
  // PERMANENT CACHE BUSTING: Forces the browser to refresh all resources on every restart.
  generateBuildId: async () => {
    return `ziona-hms-${Date.now()}`;
  },
};

export default nextConfig;
