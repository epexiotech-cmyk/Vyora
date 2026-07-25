import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
