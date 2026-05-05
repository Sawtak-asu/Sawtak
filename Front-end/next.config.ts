import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */

  // Enable standalone output for Docker production builds
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    // INTERNAL_API_URL: used server-side inside Docker (e.g. http://privacy-proxy:4000)
    // NEXT_PUBLIC_API_URL: fallback for local dev outside Docker (e.g. http://localhost:4000)
    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

