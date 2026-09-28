/**
 * Shows Cristian has actually done — each one gets its own page at
 * /shows/realizados/<slug> (Cristian's ask, 2026-09-28: "una página por
 * cada show"), listed on /shows and /eventos. Proof for whoever is about
 * to hire him, and one more indexable page per show with the town's
 * name in it, which is how people actually search ("show calistenia
 * Támesis", "espectáculo Concordia Antioquia").
 *
 * Facts only, each traceable to something Cristian told us or sent
 * (the campaign rows he approved for these same events, 2026-09-04 and
 * 2026-09-11/14). Nothing here is written ahead of an event or filled
 * in by guess: no invented audience numbers, quotes, dates or photos.
 * A photo is only attached to the show it was actually taken at.
 *
 * A plain array on purpose (same reasoning as /eventos' own comment):
 * a table earns its place once adding a show by hand stops being the
 * fastest path.
 */
export interface PastShow {
  slug: string;
  title: string;
  town: string;
  region: string;
  /** Venue as Cristian named it, if he did. */
  venue?: string;
  /** Human-readable when; exact day only when it's actually known. */
  whenLabel: string;
  /** ISO date for structured data — the first confirmed day. */
  startDate: string;
  endDate?: string;
  summary: string;
  details: string[];
  image?: { src: string; alt: string; width: number; height: number };
  collaborator?: { name: string; role: string };
  /** Slug of the QR campaign landing used at this show, if any. */
  campaignSlug?: string;
}

export const pastShows: PastShow[] = [
  {
    slug: "tamesis-2026",
    title: "Támesis — La Casa del Terror",
    town: "Támesis",
    region: "Antioquia",
    venue: "Coliseo Cubierto de Támesis (CIC)",
    whenLabel: "Septiembre de 2026 · cierre el lunes 14",
    startDate: "2026-09-11",
    endDate: "2026-09-14",
    summary:
      "Cristian Barbosa se presentó en el Coliseo Cubierto de Támesis dentro del evento \"La Casa del Terror\", con cierre el lunes 14 de septiembre, día de entrada gratis para niños de 0 a 14 años.",
    details: [
      "Presentación dentro del evento \"La Casa del Terror\", en el Coliseo Cubierto de Támesis (CIC).",
      "El último día, lunes 14 de septiembre, la entrada fue gratis para niños de 0 a 14 años.",
      "Compartió escenario con José Miguel y su número del globo de la muerte.",
    ],
    image: {
      src: "/brand/cristian-jose-globo-muerte.jpg",
      alt: "Cristian Barbosa con José Miguel, del globo de la muerte, en Támesis",
      width: 1000,
      height: 1333,
    },
    collaborator: { name: "José Miguel", role: "Globo de la muerte" },
    campaignSlug: "tamesis-2026",
  },
  {
    slug: "concordia-2026",
    title: "Concordia — espectáculo del Circo Santiago de Chile",
    town: "Concordia",
    region: "Antioquia",
    whenLabel: "Septiembre de 2026",
    startDate: "2026-09-04",
    summary:
      "Cristian Barbosa presentó en Concordia un espectáculo artístico del Circo Santiago de Chile, un circo que ha estado presente en más de 15 municipios.",
    details: [
      "Espectáculo artístico del Circo Santiago de Chile.",
      "El Circo Santiago de Chile ha estado presente en más de 15 municipios.",
    ],
    campaignSlug: "concordia-2026",
  },
];

export function getPastShow(slug: string): PastShow | undefined {
  return pastShows.find((show) => show.slug === slug);
}

export const pastShowsIndexPath = "/shows/realizados";

export function pastShowPath(slug: string): string {
  return `${pastShowsIndexPath}/${slug}`;
}
