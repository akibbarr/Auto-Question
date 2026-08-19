import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer ships a native Chromium binary — keep it as a real Node
  // dependency instead of letting Next try to bundle it for the route handler.
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
