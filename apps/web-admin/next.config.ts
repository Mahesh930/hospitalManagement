import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@medicore/api"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
