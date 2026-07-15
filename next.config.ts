import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next's dev server only trusts "localhost" by default — any other origin
  // (e.g. a LAN IP for testing on a phone/another device) gets its JS
  // chunks and HMR socket silently blocked, which reads as the page being
  // stuck forever on its server-rendered initial state (preloader frozen
  // at "000"). Allowlist the LAN address so dev-mode works there too.
  allowedDevOrigins: ["192.168.1.204"],
  // Explicit (Next already defaults to this) so the response-compression
  // behavior is documented rather than implicit. On Vercel this is moot —
  // the edge network compresses every response with Brotli (stronger than
  // gzip) regardless of this setting — but it's the correct fallback for
  // `next start` on any other host.
  compress: true,
  images: {
    remotePatterns: [
      {
        // Spotify album art for the now-playing telemetry card
        protocol: "https",
        hostname: "i.scdn.co",
      },
    ],
    // AVIF first: smaller than WebP at equivalent quality on the project
    // screenshots. Next already tries this order by default, made
    // explicit rather than relying on it.
    formats: ["image/avif", "image/webp"],
  },
  // Static assets in /public (project screenshots, resume PDF) aren't
  // content-hashed like /_next/static, so Next doesn't put a long-lived
  // cache header on them by default. They're rebuilt only by replacing
  // the file in this repo, never mutated in place, so a year-long
  // immutable cache is safe and saves a full re-download on every repeat
  // visit — the kind of thing GTmetrix/Pingdom's caching checks look for.
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
