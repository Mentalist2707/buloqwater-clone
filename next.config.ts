import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.buloqwater.uz", "localhost:3000"],
    },
  },
  images: {
    domains: ["buloqwater.uz"],
  },
};

export default nextConfig;
