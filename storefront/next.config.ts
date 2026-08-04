import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV !== 'production',
});

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3004';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${CATALOG_URL}/uploads/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
