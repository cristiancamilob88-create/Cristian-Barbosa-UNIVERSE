import { pressCoverage, siteConfig } from "@/config/site";
import type { SocialProfile } from "@/types/crm";

/**
 * Structured data (schema.org JSON-LD) Google reads to understand who
 * Cristian is and what this site is called — the "knowledge panel" and
 * site-name signals. Only facts already stated on the site or confirmed
 * by Cristian: he wants to be known first for his music, his shows and
 * the content he publishes (2026-09-24), with calistenia as the
 * discipline behind all three — not "entrenador".
 */

export const personId = `${siteConfig.url}/#person`;

export function personJsonLd(sameAs: string[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId,
    name: siteConfig.name,
    url: siteConfig.url,
    image: new URL("/opengraph-image.jpg", siteConfig.url).toString(),
    description: siteConfig.description,
    jobTitle: "Artista, performer y creador de contenido",
    nationality: { "@type": "Country", name: "Colombia" },
    knowsAbout: ["Música", "Shows en vivo", "Creación de contenido", "Calistenia"],
    subjectOf: pressCoverage.map((item) => ({
      "@type": "NewsArticle",
      headline: item.label,
      url: item.url,
      publisher: { "@type": "Organization", name: item.outlet },
    })),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.universeName,
    url: siteConfig.url,
    inLanguage: "es",
    publisher: { "@id": personId },
  };
}

/**
 * The `sameAs` list: Cristian's own public profiles, so Google can tie
 * this site and his Instagram/TikTok/YouTube/etc. to the same person.
 * Only `category = 'social'` rows — never a WhatsApp chat, a community
 * group or a donation link, which aren't "this person's profile". Rows
 * still holding a seed placeholder (a bare "https://instagram.com/" with
 * no handle) are dropped rather than published as a fake identity link.
 * Query strings (share-tracking params like `?igsi=`) are stripped, and
 * a mobile host ("m.youtube.com", what a phone's share button copies)
 * becomes "www." so Google sees the canonical profile URL.
 */
export function toSameAs(profiles: SocialProfile[]): string[] {
  const urls = new Set<string>();
  for (const profile of profiles) {
    if (profile.category !== "social") continue;
    let parsed: URL;
    try {
      parsed = new URL(profile.url);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
    const path = parsed.pathname.replace(/\/+$/, "");
    if (path === "" || path === "/@") continue;
    const host = parsed.hostname.replace(/^m\./, "www.");
    urls.add(`https://${host}${path}`);
  }
  return [...urls];
}
