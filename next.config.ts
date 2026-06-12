import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Intentionally empty - uploads served via public/ directory
  // Do NOT add headers() for /uploads/* - it overrides static file serving
};

export default nextConfig;
