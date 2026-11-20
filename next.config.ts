import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// OpenNext for Cloudflare runs Next's nodejs runtime on Workers via `nodejs_compat`
// (see wrangler.toml). Do not sprinkle `export const runtime = "edge"` into routes.
void initOpenNextCloudflareForDev();

/**
 * Security headers. The CSP is production-only: Next's dev server needs
 * 'unsafe-eval' for HMR, and we do not want to loosen the deployed policy to
 * accommodate it. Inline script/style are allowed because Next App Router
 * injects them for hydration; a nonce-based CSP is a tracked improvement
 * (see SECURITY.md). Everything is same-origin: the catalogue is fetched
 * server-side and the browser only talks to blink's own /api routes.
 */
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  ...(isProd
    ? [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join("; "),
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;