import type { NextConfig } from "next";

/**
 * Baseline security headers, applied to every route. These are the
 * defensive minimum for a public marketing/commerce surface with forms:
 * no framing (clickjacking), no MIME sniffing, a conservative referrer
 * policy, and a Permissions-Policy that opts out of APIs this app
 * doesn't use. CSP is intentionally not maximally strict yet — Next's
 * inline JSON-LD script and font loading need `unsafe-inline`/Google
 * Fonts allowances; tighten with nonces once a real CDN/analytics
 * vendor is chosen (see docs/ARCHITECTURE.md, Security).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
