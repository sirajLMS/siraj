import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./shared/i18n/request.ts",
    },
  },
  // eslint-disable-next-line sonarjs/no-hardcoded-ip
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.100.30"],
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

// Pass the path to the request config file for the plugin
const withNextIntl = createNextIntlPlugin("./shared/i18n/request.ts");

export default withNextIntl(nextConfig);
