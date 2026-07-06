import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  experimental: {
    externalDir: true
  },
  webpack: (config) => {
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, "node_modules")
    ];
    return config;
  }
};

export default nextConfig;
