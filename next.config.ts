import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @mozilla/readability and turndown have CommonJS internals that
  // break when Next bundles them into a serverless function. Loading
  // them from node_modules at runtime avoids the bundling issue.
  // (linkedom replaced jsdom; it's ESM-native and bundles cleanly.)
  serverExternalPackages: ["@mozilla/readability", "turndown"],
};

export default nextConfig;
