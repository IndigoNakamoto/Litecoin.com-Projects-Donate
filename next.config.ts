import type { NextConfig } from "next";
import path from "path";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app https://dev.shift4.com https://js.dev.shift4.com https://widget.thegivingblock.com https://vercel.live https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' https://pbs.twimg.com https://unavatar.io https://abs.twimg.com https://static.tgb-preprod.com https://static.tgbwidget.com https://cdn.prod.website-files.com https://litecoin.com https://litecoin.net https://uploads-ssl.webflow.com https://static.webflow.com https://images.webflow.com https://dev.shift4.com https://t.dev.shift4.com http://localhost:3001 http://127.0.0.1:3001 blob: data:;
  media-src 'self' https://video.twimg.com;
  connect-src 'self' https://react-tweet.vercel.app https://vitals.vercel-insights.com https://public-api.tgbwidget.com https://dev.shift4.com https://t.dev.shift4.com;
  font-src 'self' https://fonts.gstatic.com;
  frame-src giscus.app https://dev.shift4.com https://js.dev.shift4.com https://widget.thegivingblock.com https://www.youtube.com https://www.youtube-nocookie.com https://www.redditmedia.com/;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
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
  // Prevent Next from inferring the monorepo root from a different lockfile.
  // This avoids confusing warnings and makes output tracing deterministic.
  outputFileTracingRoot: path.join(__dirname),
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
        port: '3001',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/api/media/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; " +
              "script-src 'self' https://dev.shift4.com https://js.dev.shift4.com https://vercel.live; " +
              "connect-src 'self' https://public-api.tgbwidget.com https://dev.shift4.com https://t.dev.shift4.com; " +
              "img-src 'self' https://dev.shift4.com https://t.dev.shift4.com; " +
              "style-src 'self' 'unsafe-inline';",
          },
        ],
      },
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
