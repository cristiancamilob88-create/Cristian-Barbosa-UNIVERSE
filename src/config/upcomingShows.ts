/**
 * Confirmed upcoming dates — "dónde voy a estar pronto" (Cristian,
 * 2026-10-04). Shown first on /eventos (the agenda) and on /shows, as
 * gold pins on the shared map, and published as schema.org Event data
 * so Google can list them as upcoming events.
 *
 * Add a date only once it's confirmed. A date stops being "upcoming"
 * by itself the day after it ends (pages using this revalidate daily);
 * when it happens, add the town to src/config/tourStops.ts (and a page
 * in pastShows.ts if there are photos/details).
 */
export interface UpcomingShow {
  /** First day, ISO yyyy-mm-dd. */
  date: string;
  /** Last day for multi-night runs (circus: Friday–Monday). */
  endDate?: string;
  town: string;
  department: string;
  /** Venue, if known — e.g. "Coliseo cubierto". */
  venue?: string;
  /** What it is: "Circo Santiago de Chile — La Casa del Terror", "Show en colegio", … */
  title: string;
  /** Town-center coordinates. */
  geo: { lat: number; lng: number };
  /** Where to buy tickets / more info, if public. */
  url?: string;
}

export const upcomingShows: UpcomingShow[] = [];

/** Upcoming as of `today` (yyyy-mm-dd, Colombia time), soonest first. */
export function getUpcomingShows(today: string = colombiaToday()): UpcomingShow[] {
  return upcomingShows
    .filter((show) => (show.endDate ?? show.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function colombiaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(now);
}
