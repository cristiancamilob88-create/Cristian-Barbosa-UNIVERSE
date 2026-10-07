import { env } from "@/lib/env";

/**
 * Single source of truth for site-wide constants: brand copy, navigation,
 * and social/contact links. Route pages and layout read from here instead
 * of hardcoding strings, so the nav and footer never drift from what the
 * routes actually are.
 */

export const siteConfig = {
  name: "Cristian Barbosa",
  universeName: "CRISTIAN BARBOSA UNIVERSE",
  tagline: "Artista, performer, atleta — un universo, muchas formas de entrar.",
  description:
    "Cristian Barbosa: artista, performer y creador de contenido de Envigado, Antioquia. Escucha su música, contrata un show en vivo de calistenia o síguelo en redes.",
  // Read through src/lib/env.ts's validated export, not process.env
  // directly (AGENTS.md's own rule) — the previous direct read bypassed
  // zod's validation/default entirely and broke the Vercel production
  // build: an env var saved with a blank value in Vercel's dashboard is
  // an empty string, not absent, so `process.env.X ?? fallback` never
  // fell back and `new URL("")` in src/app/layout.tsx threw
  // `ERR_INVALID_URL` (confirmed via the real Vercel build log, Block
  // 08.10 Fase 10). `env.NEXT_PUBLIC_SITE_URL` already guards against
  // exactly that case.
  url: env.NEXT_PUBLIC_SITE_URL,
  locale: "es",
} as const;

/**
 * Real press coverage of Cristian, shown on /about and published in the
 * Person structured data (`subjectOf`) — third-party coverage is one of
 * the strongest signals Google uses to recognize a person. Same article
 * already linked from the Concordia campaign landing (supabase/seed.sql,
 * 0011 — verified live when Cristian sent it, 2026-09-04); /about is the
 * indexable home for it, campaign landings are noindex.
 */
export interface PressItem {
  outlet: string;
  label: string;
  year: number;
  /** Public link, when there is one (TV segments often aren't online). */
  url?: string;
  /** Real clipping/photo of the coverage, when Cristian sent one. */
  image?: string;
}

export const pressCoverage: PressItem[] = [
  {
    outlet: "El Colombiano",
    label: "Entrevista con El Colombiano",
    year: 2026,
    // Canonical (non-AMP) URL, sent by Cristian 2026-10-03.
    url: "https://www.elcolombiano.com/deportes/cristian-barbosa-caliestania-envigado-practica-que-crece-en-area-metropolitana-PP33788025",
    image: "/brand/press-el-colombiano.jpg",
  },
  {
    // Cristian's own account (2026-10-03); no public link yet.
    outlet: "Telemedellín",
    label: "Entrevista en Telemedellín, en el programa de Mayita",
    year: 2025,
  },
];

/**
 * Brands Cristian officially represents (2026-10-07: brand ambassador for
 * Club Nativos, a private business club — he keeps it in his Instagram
 * bio). Their accounts aren't his own channels, so they're never a
 * `social_profile`/GoLink row; pages link them with `TrackedLink
 * external`, the same reasoning docs/UNIVERSE_UX.md §10 applies to
 * collaborator and press links.
 */
export const ambassadorships = [
  {
    name: "Club Nativos",
    role: "Embajador de marca",
    detail: "Club privado de negocios",
    platform: "instagram",
    url: "https://www.instagram.com/club.nativos/",
    cta: "ambassador_club_nativos",
  },
] as const;

export interface NavItem {
  /** Short mono-space tag used as the visual/identifier label, e.g. "ENTRENAR". */
  tag: string;
  label: string;
  href: string;
  description: string;
  /**
   * The first-person intention phrase this route answers — "¿Qué puedo
   * hacer aquí?" (Block 04.2, docs/UNIVERSE_UX.md). Used as the homepage
   * hub's CTA phrasing and as each landing's own primary CTA text — not
   * a second label, the actual verb a visitor clicks on. Never "Quiero
   * ser parte" (too ambiguous — see docs/UNIVERSE_UX.md for why).
   */
  intent: string;
  /** Semantic id for cta_click's `cta` field (docs/ANALYTICS_ENGINE.md, "Event taxonomy audit") — no new event, just a stable name for this intention. */
  intentId: string;
  /** In the main menu and the homepage hub; the rest go under "Más". */
  primary?: boolean;
}

/**
 * The commercial routes of the universe. This list drives the main nav,
 * the homepage pillar grid, and sitemap.ts — add a route here once and it
 * shows up everywhere it needs to.
 *
 * Reorganized 2026-10-07 with Cristian ("le hace falta orden… mucha
 * información desorganizada"): 13 menu links became 4 paths + the map
 * — Música, Shows, Mapa y agenda, Entrenar, Historia (`primary: true`),
 * the main menu and the homepage hub. The rest stay real pages, listed
 * under "Más" (footer, mobile menu, sitemap). Productos stays out of the
 * main menu until there are real products to sell.
 */
/**
 * The ONE public link for "dónde va a estar y dónde ha estado" (Cristian,
 * 2026-10-07: "requerimos de un link para compartirlo en las redes").
 * Upcoming dates + map + every past show live on this single page;
 * /eventos and /shows/realizados permanently redirect here
 * (next.config.ts). /shows stays the page for hiring a show.
 */
export const agendaHref = "/agenda";

export const navItems: NavItem[] = [
  // ---- The main menu: 4 paths + the map (primary: true) ----
  {
    tag: "MÚSICA",
    label: "Música",
    href: "/musica",
    description: "El Diamante, la historia detrás de cada canción y el acceso anticipado.",
    intent: "Quiero escuchar su música",
    intentId: "intent_music",
    primary: true,
  },
  {
    tag: "SHOWS",
    label: "Shows",
    href: "/shows",
    description: "Shows en vivo para empresas, colegios, alcaldías y eventos.",
    intent: "Quiero contratar un show",
    intentId: "intent_shows",
    primary: true,
  },
  {
    tag: "MAPA",
    label: "Mapa y agenda",
    href: agendaHref,
    description: "Próximos shows y el mapa de dónde se ha presentado.",
    intent: "Quiero ver la agenda",
    intentId: "intent_events",
    primary: true,
  },
  {
    tag: "ENTRENAR",
    label: "Entrenar",
    href: "/entrenar",
    description: "De la comunidad gratis a la sesión 1:1 y el coaching personalizado.",
    intent: "Quiero entrenar",
    intentId: "intent_training",
    primary: true,
  },
  {
    tag: "HISTORIA",
    label: "Historia",
    href: "/about",
    description: "Quién es Cristian Barbosa: su historia, logros y prensa.",
    intent: "Quiero conocer su historia",
    intentId: "intent_story",
    primary: true,
  },
  // ---- "Más": real pages, reachable from the footer and the mobile menu ----
  {
    tag: "COMUNIDAD",
    label: "Comunidad",
    href: "/comunidad",
    description: "WhatsApp gratuito y Entrena con Cristian Barbosa (Facebook Subscription).",
    intent: "Quiero entrar a la comunidad",
    intentId: "intent_community",
  },
  {
    // Not a separate page — /entrenar's "Coaching personalizado" card.
    tag: "COACHING",
    label: "Coaching",
    href: "/entrenar#coaching",
    description: "Programación, seguimiento y contacto directo con Cristian.",
    intent: "Quiero coaching personalizado",
    intentId: "intent_coaching",
  },
  {
    tag: "MARCAS",
    label: "Marcas",
    href: "/marcas",
    description: "Patrocinios, alianzas y colaboraciones de marca.",
    intent: "Quiero trabajar con Cristian",
    intentId: "intent_brands",
  },
  {
    tag: "PRODUCTOS",
    label: "Productos",
    href: "/productos",
    description: "Productos físicos y digitales — ropa, accesorios, cursos.",
    intent: "Quiero ver los productos",
    intentId: "intent_products",
  },
  {
    tag: "REDES",
    label: "Redes",
    href: "/redes",
    description: "Todos los canales oficiales, en un solo lugar.",
    intent: "Quiero seguir a Cristian",
    intentId: "intent_social",
  },
];

export const secondaryNavItems: NavItem[] = [
  {
    tag: "SERVICIOS",
    label: "Servicios",
    href: "/servicios",
    description: "Shows, sesiones 1:1, coaching y alianzas — todo en un solo lugar.",
    intent: "Quiero ver sus servicios",
    intentId: "intent_services",
  },
  {
    tag: "BLOG",
    label: "Blog",
    href: "/blog",
    description: "Historias, shows y música.",
    intent: "Quiero leer sus historias",
    intentId: "intent_blog",
  },
  {
    tag: "CONTACTO",
    label: "Contacto",
    href: "/contacto",
    description: "Hablemos — shows, marcas o preguntas generales.",
    intent: "Quiero hablar con Cristian",
    intentId: "intent_contact",
  },
];

/**
 * `/go/<slug>` route identifiers used by Header/Footer/comunidad chrome —
 * NOT destination URLs. The actual URL lives only in the `social_profile`
 * table (supabase/seed.sql seeds these same slugs) and is resolved at
 * redirect time in src/app/go/[slug]/route.ts. Keeping only slugs here
 * (not URLs) is what "single source of truth" means in practice: this
 * file can name *which* channels appear in nav chrome without ever
 * duplicating *where* they point. See docs/SOCIAL_ROUTING.md.
 */
export const goLinks = {
  whatsappCommunity: "whatsapp-community",
  /** The single commercial WhatsApp number (docs/MASTER_BRIEF_BLOCK_07_10.md) — shows, coaching, marcas, productos, consultas. Distinct from whatsappCommunity, the free entry-level chat. */
  whatsappCommercial: "whatsapp-commercial",
  instagram: "instagram-main",
  instagramCommunity: "instagram-community",
  tiktok: "tiktok-main",
  tiktokSecondary: "tiktok-secondary",
  youtube: "youtube-main",
  x: "x-main",
  linkedin: "linkedin-main",
  facebook: "facebook-main",
  facebookSecondary: "facebook-secondary",
  facebookSubscription: "facebook-subscription",
  /** Voluntary support/donate links (Cristian's own PayPal + Nequi
   * links, 2026-08-28) — GoLinks, not CheckoutLinks: neither is a
   * priced offer in the commerce catalog, both are outbound links like
   * any social channel, just to a donation page instead of a profile.
   * Both confirmed reusable + open-amount before shipping, not assumed
   * — see docs/RUNNING_CHECKLIST.md. */
  paypalDonate: "paypal-donate",
  nequiDonate: "nequi-donate",
} as const;

/** The main menu and homepage hub: the 4 paths + the map. */
export const primaryNavItems = navItems.filter((item) => item.primary);

/** Everything else, for "Más" (footer, mobile menu). */
export const moreNavItems = [...navItems.filter((item) => !item.primary), ...secondaryNavItems.filter((item) => item.href !== "/contacto")];

export const contactNavItem = secondaryNavItems.find((item) => item.href === "/contacto")!;
