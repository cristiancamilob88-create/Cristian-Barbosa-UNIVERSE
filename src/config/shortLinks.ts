/**
 * Short, typeable links for bios and stories (Cristian, 2026-10-07:
 * "que el panel entienda de dónde viene cada visita"). Each one is a
 * plain redirect (next.config.ts) to a page WITH its UTM tags, so
 * src/proxy.ts records network + where on it + campaign exactly as if
 * the long link had been pasted — `cristian-barbosa-universe.vercel.app/ig`
 * instead of a 100-character URL nobody types.
 *
 * They land on /redes, Cristian's link-in-bio page (2026-10-08: "ese es
 * el que va a contar cuánta gente entra, cuánta gente sale") — every
 * button there is a GoLink/TrackedLink, so the exits are recorded too.
 *
 * Temporary (307) redirects on purpose: a destination or tag can change
 * later without browsers having cached the old one.
 *
 * Plain data with relative imports only — next.config.ts imports it.
 */
export interface ShortLink {
  /** The short path, e.g. "/ig". */
  path: string;
  /** Page it lands on. */
  destination: string;
  source: string;
  medium: string;
  campaign: string;
  /** Where Cristian puts it — shown nowhere on the site, just a note. */
  use: string;
}

export const shortLinks: ShortLink[] = [
  { path: "/ig", destination: "/redes", source: "instagram", medium: "bio", campaign: "perfil", use: "Bio de Instagram" },
  { path: "/tt", destination: "/redes", source: "tiktok", medium: "bio", campaign: "perfil", use: "Bio de TikTok" },
  { path: "/fb", destination: "/redes", source: "facebook", medium: "bio", campaign: "perfil", use: "Perfil de Facebook" },
  { path: "/yt", destination: "/redes", source: "youtube", medium: "descripcion", campaign: "perfil", use: "Canal y descripciones de YouTube" },
  { path: "/wa", destination: "/redes", source: "whatsapp", medium: "directo", campaign: "perfil", use: "Estado y mensajes de WhatsApp" },
];

export function shortLinkDestination(link: ShortLink): string {
  const query = new URLSearchParams({ utm_source: link.source, utm_medium: link.medium, utm_campaign: link.campaign });
  return `${link.destination}?${query.toString()}`;
}
