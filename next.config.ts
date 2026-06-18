import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow other devices on the LAN to load dev assets (/_next/*) during npm run dev.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.209",
    ...(process.env.LAN_DEV_ORIGIN ? [process.env.LAN_DEV_ORIGIN] : []),
  ],
};

export default nextConfig;
