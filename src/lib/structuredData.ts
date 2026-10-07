import { pressCoverage, siteConfig } from "@/config/site";
import { achievements } from "@/config/biography";
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
    homeLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: "Envigado", addressRegion: "Antioquia", addressCountry: "CO" },
    },
    knowsAbout: ["Música", "Shows en vivo", "Creación de contenido", "Calistenia"],
    award: achievements.titles.map((title) => title.label),
    subjectOf: pressCoverage
      .filter((item) => item.url)
      .map((item) => ({
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

/**
 * Where he has performed, as data Google can read — not only the map
 * (drawn in the browser, invisible to crawlers) and the text list
 * (/agenda, Cristian's ask 2026-10-07: "que Google sepa que yo estuve
 * en esos pueblos"). A WebPage about the Person whose mainEntity is an
 * ItemList of Places. Deliberately NOT one Event per town: an Event
 * needs a date and we don't have one per town — inventing dates is off
 * the table, and dateless Events would show as errors in Search Console.
 */
export function performedPlacesJsonLd(
  stops: {
    town: string;
    department: string;
    kind: "circo" | "instituciones";
    geo: { lat: number; lng: number };
    note?: string;
    corregimientoGeo?: Record<string, { lat: number; lng: number }>;
  }[],
  pageUrl: string,
) {
  const describe = (stop: (typeof stops)[number]) =>
    stop.note ?? `${siteConfig.name} se presentó aquí de gira con el Circo Santiago de Chile.`;
  const town = (stop: (typeof stops)[number]) => ({
    "@type": "Place",
    name: `${stop.town}, ${stop.department}`,
    description: describe(stop),
    address: { "@type": "PostalAddress", addressLocality: stop.town, addressRegion: stop.department, addressCountry: "CO" },
    geo: { "@type": "GeoCoordinates", latitude: stop.geo.lat, longitude: stop.geo.lng },
  });

  const places = stops.flatMap((stop) => [
    town(stop),
    ...Object.entries(stop.corregimientoGeo ?? {}).map(([name, geo]) => ({
      "@type": "Place",
      name: `${name} (corregimiento de ${stop.town}), ${stop.department}`,
      description: describe(stop),
      containedInPlace: { "@type": "Place", name: `${stop.town}, ${stop.department}` },
      address: { "@type": "PostalAddress", addressLocality: name, addressRegion: stop.department, addressCountry: "CO" },
      geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng },
    })),
  ]);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#lugares`,
    url: pageUrl,
    name: `Dónde se ha presentado ${siteConfig.name}`,
    about: { "@id": personId },
    mainEntity: {
      "@type": "ItemList",
      name: `Municipios, corregimientos y ciudades donde se ha presentado ${siteConfig.name}`,
      numberOfItems: places.length,
      itemListElement: places.map((place, i) => ({ "@type": "ListItem", position: i + 1, item: place })),
    },
  };
}
