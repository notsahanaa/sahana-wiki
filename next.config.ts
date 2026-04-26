import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsdom + @mozilla/readability + turndown all use CommonJS internals that
  // break when Next bundles them into a serverless function. Loading them
  // from node_modules at runtime avoids the bundling issue.
  serverExternalPackages: ["jsdom", "@mozilla/readability", "turndown"],
};

export default nextConfig;
