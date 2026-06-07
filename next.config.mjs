/** @type {import('next').NextConfig} */
const nextConfig = {
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
