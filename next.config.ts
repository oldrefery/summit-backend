import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iabwkgppahudnaouwaep.supabase.co',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {},
  },
  env: {
    SUPABASE_ANON_EMAIL: process.env.SUPABASE_ANON_EMAIL,
    SUPABASE_ANON_PASSWORD: process.env.SUPABASE_ANON_PASSWORD,
  },
};

export default nextConfig;
