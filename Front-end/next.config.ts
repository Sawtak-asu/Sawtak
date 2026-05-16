import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const isMobileBuild = process.env.NEXT_BUILD_TARGET === "mobile";

const nextConfig: NextConfig = {
  /* config options here */

  // Mobile build (Capacitor) → static export
  // Web/Docker build → standalone
  output: isMobileBuild ? "export" : "standalone",
  trailingSlash: isMobileBuild ? true : false,

  images: {
    // Required for static export (mobile), or when using remote images
    unoptimized: isMobileBuild ? true : false,
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
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // Only use rewrites in web mode (Capacitor static export doesn't support rewrites)
  ...(!isMobileBuild && {
    async rewrites() {
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
  }),

  experimental: {
    proxyClientMaxBodySize: '50mb',
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default withNextIntl(nextConfig);

