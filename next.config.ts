import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    // Disable image optimization for localhost URLs to avoid 400 errors
    // The Next.js Image Optimization API can't reach localhost:5000 from the server side
    unoptimized: true,
    remotePatterns: [
      ...["localhost", "127.0.0.1", "backend"].flatMap(hostname => [
        {
          protocol: "http" as const,
          hostname,
          pathname: "/**",
        },
        {
          protocol: "https" as const,
          hostname,
          pathname: "/**",
        },
      ]),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
