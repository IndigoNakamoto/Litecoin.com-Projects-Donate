import type { NextConfig } from "next";
import path from "path";

// CSP is set in middleware.ts with a per-request nonce (no unsafe-inline/unsafe-eval).
const securityHeaders = [
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Prevent Next from inferring the monorepo root from a different lockfile.
  // This avoids confusing warnings and makes output tracing deterministic.
  outputFileTracingRoot: path.join(__dirname),
  // pdfkit loads Helvetica.afm etc. from disk at runtime — keep it external
  // and include AFM data in the standalone trace for cron PDF reports.
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/cron/daily/*": ["./node_modules/pdfkit/js/data/**/*"],
    "/api/cron/monthly/*": ["./node_modules/pdfkit/js/data/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
        pathname: '/**',
      },
      // Payload CMS local dev (uploads served from /api/media/file)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3011',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3011',
        pathname: '/api/media/**',
      },
      // Payload CMS production (via Cloudflare tunnel)
      {
        protocol: 'https',
        hostname: 'projectscms.lite.space',
        pathname: '/api/media/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
