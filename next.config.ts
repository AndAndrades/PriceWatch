import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.scene7.com",
      },
      {
        protocol: "https",
        hostname: "**.falabella.com",
      },
      {
        protocol: "https",
        hostname: "**.falabella.cl",
      },
    ],
  },
};

export default nextConfig;
