/**
 * Single source of truth for site-wide constants: brand copy, navigation,
 * and social/contact links. Route pages and layout read from here instead
 * of hardcoding strings, so the nav and footer never drift from what the
 * routes actually are.
 */

export const siteConfig = {
  name: "Cristian Barbosa",
  universeName: "CRISTIAN BARBOSA UNIVERSE",
  tagline: "Entrenamiento, comunidad, música y shows — un solo universo.",
  description:
    "El universo digital de Cristian Barbosa: calistenia, coaching, comunidad, música, productos y shows en un solo lugar.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cristianbarbosa.com",
  locale: "es",
} as const;

export interface NavItem {
  /** Short mono-space tag used as the visual/identifier label, e.g. "TRAIN". */
  tag: string;
  label: string;
  href: string;
  description: string;
}

/**
 * The commercial routes of the universe. This list drives the main nav,
 * the homepage pillar grid, and sitemap.ts — add a route here once and it
 * shows up everywhere it needs to.
 */
export const navItems: NavItem[] = [
  {
    tag: "TRAIN",
    label: "Entrenar",
    href: "/entrenar",
    description: "Calistenia, coaching y el camino de entrenamiento con Cristian.",
  },
  {
    tag: "COMMUNITY",
    label: "Comunidad",
    href: "/comunidad",
    description: "WhatsApp gratuito y Entrena con Cristian Barbosa (Facebook Subscription).",
  },
  {
    tag: "MUSIC",
    label: "Música",
    href: "/musica",
    description: "Lanzamientos, historia detrás de la canción y acceso anticipado.",
  },
  {
    tag: "SHOP",
    label: "Productos",
    href: "/productos",
    description: "Productos físicos y digitales — ropa, accesorios, cursos.",
  },
  {
    tag: "SHOWS",
    label: "Shows",
    href: "/shows",
    description: "Shows en vivo para empresas, colegios, universidades y eventos.",
  },
  {
    tag: "BRANDS",
    label: "Marcas",
    href: "/marcas",
    description: "Partnerships, sponsors y colaboraciones de marca.",
  },
  {
    tag: "EVENTS",
    label: "Eventos",
    href: "/eventos",
    description: "Agenda de próximas apariciones y eventos.",
  },
  {
    tag: "NETWORK",
    label: "Redes",
    href: "/redes",
    description: "Todos los canales oficiales, en un solo lugar.",
  },
];

export const secondaryNavItems: NavItem[] = [
  {
    tag: "ABOUT",
    label: "Historia",
    href: "/about",
    description: "Quién es Cristian Barbosa.",
  },
  {
    tag: "CONTACT",
    label: "Contacto",
    href: "/contacto",
    description: "Hablemos — shows, marcas o preguntas generales.",
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
  instagram: "instagram-main",
  tiktok: "tiktok-main",
  youtube: "youtube-main",
  facebookSubscription: "facebook-subscription",
} as const;
