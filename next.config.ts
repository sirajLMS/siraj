import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function getLanIpAddresses(): string[] {
  const nets = networkInterfaces();
  const addresses: string[] = [];
  for (const interfaces of Object.values(nets)) {
    if (!interfaces) continue;
    for (const iface of interfaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

function buildDevOrigins(): string[] {
  const origins = ["127.0.0.1", "localhost"];
  if (getEnv("NODE_ENV", "development") === "development") {
    origins.push(...getLanIpAddresses());
    const envOrigin = getEnv("DEV_ORIGIN", "");
    if (envOrigin) origins.push(envOrigin);
  }
  return origins.filter(Boolean);
}

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  distDir: getEnv("NEXT_DIST_DIR", ".next"),
  reactStrictMode: true,
  serverExternalPackages: ["pg", "@neondatabase/serverless", "drizzle-orm", "ws", "@vercel/functions"],
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./shared/i18n/request.ts",
    },
  },
  allowedDevOrigins: buildDevOrigins(), // NoSonar
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
    unoptimized: getEnv("NODE_ENV", "development") === "development",
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
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "vercel.live",
        pathname: "/**",
      },
    ],
  },
};

// Pass the path to the request config file for the plugin
const withNextIntl = createNextIntlPlugin("./shared/i18n/request.ts");

export default withNextIntl(nextConfig);
