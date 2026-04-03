import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fix: Next.js 16 detects multiple lockfiles and picks wrong workspace root
    root: __dirname,
  },
  // Workaround for Next.js 16.2.2 bug: /_global-error prerender fails with
  // "invariant expected layout router to be mounted" in all projects.
  experimental: {
    staticGenerationRetryCount: 0,
  },
};

export default nextConfig;
