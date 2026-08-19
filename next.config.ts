import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

function getEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

function resolveBuildId(): string {
  if (process.env.NEXT_PUBLIC_BUILD_ID) {
    return process.env.NEXT_PUBLIC_BUILD_ID;
  }
  const versionFile = ".next-locale-snapshots-version";
  if (existsSync(versionFile)) {
    try {
      const content = readFileSync(versionFile, "utf8").trim();
      if (content) return content;
    } catch {
      // Fall through to UUID fallback
    }
  }
  return randomUUID();
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

const buildId = resolveBuildId();

/** @type {import('next').NextConfig} */
const isDev = getEnv("NODE_ENV", "development") === "development";
const nextConfig: NextConfig = {
  distDir: getEnv("NEXT_DIST_DIR", ".next"),
  reactStrictMode: true,
  generateBuildId: () => buildId,
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
    NEXT_PUBLIC_LOCALE_SNAPSHOT_BASE: "/static/locale-snapshots",
  },
  serverExternalPackages: ["pg", "@neondatabase/serverless", "drizzle-orm", "ws", "@vercel/functions", "newrelic"],
  // Ensure the full newrelic package is traced into serverless function bundles on Vercel.
  // Without this, @vercel/nft may tree-shake parts of the agent that are dynamically loaded.
  outputFileTracingIncludes: { "/*": ["./node_modules/newrelic/**/*"] },
  turbopack: {},
  experimental: {
    useTypeScriptCli: false,
    optimizePackageImports: [
      "@mui/x-data-grid",
      "@mui/x-date-pickers",
      "@mui/icons-material",
      "@mui/material",
      "date-fns",
    ],
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
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    // Disable image optimization for localhost URLs to avoid 400 errors
    // The Next.js Image Optimization API can't reach localhost:5000 from the server side
    unoptimized: isDev,
    // localhost/127.0.0.1 and "backend" hostnames are dev-only to avoid SSRF risk in production.
    remotePatterns: [
      // Dev-only: allow optimized images from local backend services
      ...(isDev
        ? (["localhost", "127.0.0.1", "backend"] as const).flatMap(hostname => [
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
          ])
        : []),
      // Production: only trusted third-party image CDNs
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

export default nextConfig;
