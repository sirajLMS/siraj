import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  serverExternalPackages: ["pg", "@neondatabase/serverless", "drizzle-orm", "ws", "@vercel/functions"],
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./shared/i18n/request.ts",
    },
  },
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.100.30"], // NoSonar
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "0" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  images: {
    // Disable image optimization for localhost URLs to avoid 400 errors
    // The Next.js Image Optimization API can't reach localhost:5000 from the server side
    unoptimized: process.env.NODE_ENV === "development",
    // NOTE: localhost/127.0.0.1 patterns should ONLY be used in development environments.
    // Remove or restrict these in production to prevent unauthorized image source origins.
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
