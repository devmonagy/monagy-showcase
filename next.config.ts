import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next's dev server only trusts "localhost" by default — any other origin
  // (e.g. a LAN IP for testing on a phone/another device) gets its JS
  // chunks and HMR socket silently blocked, which reads as the page being
  // stuck forever on its server-rendered initial state (preloader frozen
  // at "000"). Allowlist the LAN address so dev-mode works there too.
  allowedDevOrigins: ["192.168.1.204"],
  images: {
    remotePatterns: [
      {
        // Spotify album art for the now-playing telemetry card
        protocol: "https",
        hostname: "i.scdn.co",
      },
    ],
  },
};

export default nextConfig;
