import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@financial-planner/core', '@financial-planner/types'],
};

export default nextConfig;
