import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/**
 * Builds route metadata from a small set of inputs so every page gets a
 * consistent title template, description fallback, canonical URL, and
 * Open Graph block without repeating boilerplate per route.
 */
export function buildMetadata(input: {
  title: string;
  description: string;
  path: string;
  /** Set for a route that shouldn't show up in search results (a campaign-specific QR landing, e.g.) — still gets a real OG block, since sharing the link directly (WhatsApp, printed QR) is exactly the point. */
  noindex?: boolean;
}): Metadata {
  const url = new URL(input.path, siteConfig.url).toString();

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: siteConfig.universeName,
      locale: "es_CO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
  };
}
