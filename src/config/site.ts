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
  tagline: "Atleta, artista, entrenador — un universo, muchas formas de entrar.",
  description:
    "El universo digital de Cristian Barbosa: calistenia, coaching, comunidad, música, productos y shows en un solo lugar.",
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

export interface NavItem {
  /** Short mono-space tag used as the visual/identifier label, e.g. "TRAIN". */
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
}

/**
 * The commercial routes of the universe. This list drives the main nav,
 * the homepage pillar grid, and sitemap.ts — add a route here once and it
 * shows up everywhere it needs to.
 *
 * Order is Cristian's own, updated 2026-08-28 (third pass, same day):
 * entrenar, comunidad, coaching, shows, música, marcas, eventos,
 * productos, historia, redes. Productos moved to near-last on purpose —
 * his own words: the checkout/payment gateway and shipping (Dropi or
 * similar) aren't configured yet, so it's not the page he wants leading
 * people right now. Historia/Redes swapped from the previous pass
 * (Claude's suggestion, Cristian agreed): "seguir en redes" reads as
 * the natural closing action after "conoce mi historia", not before it.
 */
export const navItems: NavItem[] = [
  {
    tag: "TRAIN",
    label: "Entrenar",
    href: "/entrenar",
    description: "Calistenia, coaching y el camino de entrenamiento con Cristian.",
    intent: "Quiero entrenar",
    intentId: "intent_training",
  },
  {
    tag: "COMMUNITY",
    label: "Comunidad",
    href: "/comunidad",
    description: "WhatsApp gratuito y Entrena con Cristian Barbosa (Facebook Subscription).",
    intent: "Quiero entrar a la comunidad",
    intentId: "intent_community",
  },
  {
    // Not a separate page — same /entrenar page, jumping straight to its
    // "Coaching personalizado" card via #coaching. Cristian explicitly
    // wants both: this dedicated card here AND the same offer still
    // reachable as part of "Quiero entrenar" (kept unchanged above).
    tag: "COACHING",
    label: "Coaching",
    href: "/entrenar#coaching",
    description: "Programación, seguimiento y contacto directo con Cristian.",
    intent: "Quiero coaching personalizado",
    intentId: "intent_coaching",
  },
  {
    tag: "SHOWS",
    label: "Shows",
    href: "/shows",
    description: "Shows en vivo para empresas, colegios, universidades y eventos.",
    intent: "Quiero contratar un show",
    intentId: "intent_shows",
  },
  {
    tag: "MUSIC",
    label: "Música",
    href: "/musica",
    description: "Lanzamientos, historia detrás de la canción y acceso anticipado.",
    intent: "Quiero escuchar su música",
    intentId: "intent_music",
  },
  {
    tag: "BRANDS",
    label: "Marcas",
    href: "/marcas",
    description: "Partnerships, sponsors y colaboraciones de marca.",
    intent: "Quiero trabajar con Cristian",
    intentId: "intent_brands",
  },
  {
    tag: "EVENTS",
    label: "Eventos",
    href: "/eventos",
    description: "Agenda de próximas apariciones y eventos.",
    intent: "Quiero ver la agenda",
    intentId: "intent_events",
  },
  {
    tag: "SHOP",
    label: "Productos",
    href: "/productos",
    description: "Productos físicos y digitales — ropa, accesorios, cursos.",
    intent: "Quiero ver los productos",
    intentId: "intent_products",
  },
  {
    tag: "ABOUT",
    label: "Historia",
    href: "/about",
    description: "Quién es Cristian Barbosa.",
    intent: "Quiero conocer su historia",
    intentId: "intent_story",
  },
  {
    tag: "NETWORK",
    label: "Redes",
    href: "/redes",
    description: "Todos los canales oficiales, en un solo lugar.",
    intent: "Quiero seguir a Cristian",
    intentId: "intent_social",
  },
];

export const secondaryNavItems: NavItem[] = [
  {
    tag: "CONTACT",
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
  /** Voluntary support/donate link (Cristian's own PayPal donate
   * button, 2026-08-28) — a GoLink, not a CheckoutLink: this isn't a
   * priced offer in the commerce catalog, it's an outbound link like
   * any social channel, just to a donation page instead of a profile. */
  paypalDonate: "paypal-donate",
} as const;
