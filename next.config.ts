import type { NextConfig } from "next";
import { shortLinkDestination, shortLinks } from "./src/config/shortLinks";

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
      // Google Maps Platform hosts (address autocomplete + map in the
      // shows form, 2026-09-28) — the exact list Google documents for
      // the Maps JavaScript API under a CSP. Nothing else added.
      "script-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com https://*.googleusercontent.com blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.googleapis.com https://*.google.com https://*.gstatic.com data: blob:",
      "worker-src 'self' blob:",
      // Only Instagram's own /embed iframe (InstagramEmbed.tsx) — a
      // plain iframe, not a vendor SDK. Added with the first real use,
      // 2026-08-25.
      "frame-src https://www.instagram.com https://*.google.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // One shareable link for shows (2026-10-07): the old agenda and
  // past-shows index merged into /agenda (src/config/site.ts, agendaHref).
  // Permanent so Google moves the already-submitted URLs over.
  async redirects() {
    return [
      { source: "/eventos", destination: "/agenda", permanent: true },
      { source: "/shows/realizados", destination: "/agenda", permanent: true },
      // Short bio links (/ig, /tt, …) → the page with its UTM tags.
      ...shortLinks.map((link) => ({ source: link.path, destination: shortLinkDestination(link), permanent: false })),
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
