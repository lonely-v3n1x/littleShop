import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// OpenNext for Cloudflare runs Next's nodejs runtime on Workers via `nodejs_compat`
// (see wrangler.toml). Do not sprinkle `export const runtime = "edge"` into routes.
void initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
