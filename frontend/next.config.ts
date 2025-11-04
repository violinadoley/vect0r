import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint errors during production builds on Vercel; keep linting locally
  eslint: {
    ignoreDuringBuilds: true,
  },
  // If you ever need to bypass TS errors during CI builds, uncomment below:
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;
