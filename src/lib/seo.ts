import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/**
 * Builds route metadata from a small set of inputs so every page gets a
 * consistent title template, description fallback, canonical URL, and
 * Open Graph block without repeating boilerplate per route.
 */
export function buildMetadata(input: {
  title: string;
  /** Use `title` as the full <title>, skipping the root layout's "%s — Cristian Barbosa" template — for a title that already names Cristian (the homepage, /about), so it doesn't read "… Cristian Barbosa — Cristian Barbosa". */
  absoluteTitle?: boolean;
  description: string;
  path: string;
  /** Set for a route that shouldn't show up in search results (a campaign-specific QR landing, e.g.) — still gets a real OG block, since sharing the link directly (WhatsApp, printed QR) is exactly the point. */
  noindex?: boolean;
}): Metadata {
  const url = new URL(input.path, siteConfig.url).toString();
  // What a share card (WhatsApp, Facebook, X, Google Discover) shows as
  // the headline — the full title, same as the <title> tag, not the bare
  // page name the layout template would otherwise append to.
  const shareTitle = input.absoluteTitle ? input.title : `${input.title} — ${siteConfig.name}`;
  // Setting `openGraph` here replaces the parent's whole openGraph block,
  // including the image src/app/opengraph-image.jpg contributes at the
  // root — so every page names it explicitly or its share card has none
  // (found by rendering /about and /shows, which had no og:image).
  const images = [{ url: "/opengraph-image.jpg", width: 1200, height: 630, alt: siteConfig.name }];

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: shareTitle,
      description: input.description,
      url,
      siteName: siteConfig.universeName,
      locale: "es_CO",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: input.description,
      images,
    },
  };
}
