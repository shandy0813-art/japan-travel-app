import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.68.60', '192.168.68.103'],
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
    ];
  },
};

export default nextConfig;
