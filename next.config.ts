/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    // Disable image optimization for localhost URLs to avoid 400 errors
    // The Next.js Image Optimization API can't reach localhost:5000 from the server side
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "127.0.0.1",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "backend",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "backend",
        pathname: "/**",
      },
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
