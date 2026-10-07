import { pastShowPath } from "@/config/pastShows";
import { tourStops, type TourStop } from "@/config/tourStops";
import { getUpcomingShows, type UpcomingShow } from "@/config/upcomingShows";
import { formatDateRange } from "@/lib/format";

/**
 * Everything the interactive map (ShowsMap) shows, as one flat list:
 * every tour stop plus every upcoming date. Pure data shaping — kept out
 * of the Leaflet component so it can be unit tested.
 */

export type PlaceKind = "next" | "circo" | "edu" | "home";

export interface MapPlace {
  id: string;
  kind: PlaceKind;
  town: string;
  /** "Suroeste, Antioquia" / "Chocó" — the line under the town name. */
  region: string;
  /** For upcoming dates: "15–18 de octubre de 2026". */
  when?: string;
  detail: string;
  corregimientos?: string[];
  /** This site's own page for the show, if it has one. */
  showPath?: string;
  /** Ticket / info link for an upcoming date. */
  externalUrl?: string;
  geo: { lat: number; lng: number };
  /** Opens the town in Google Maps (no API key needed — a plain search link). */
  googleMapsUrl: string;
}

export const HOME_TOWN = "Envigado";

export function googleMapsSearchUrl(town: string, department: string): string {
  const query = `${town}, ${department}, Colombia`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function regionOf(stop: TourStop): string {
  return stop.subregion === stop.department ? stop.department : `${stop.subregion}, ${stop.department}`;
}

function fromStop(stop: TourStop): MapPlace {
  const kind: PlaceKind = stop.town === HOME_TOWN ? "home" : stop.kind === "circo" ? "circo" : "edu";
  return {
    id: `stop-${stop.town}`,
    kind,
    town: stop.town,
    region: regionOf(stop),
    detail: stop.note ?? "Gira con el Circo Santiago de Chile",
    corregimientos: stop.corregimientos,
    showPath: stop.showSlug ? pastShowPath(stop.showSlug) : undefined,
    geo: stop.geo,
    googleMapsUrl: googleMapsSearchUrl(stop.town, stop.department),
  };
}

function fromUpcoming(show: UpcomingShow): MapPlace {
  return {
    id: `next-${show.date}-${show.town}`,
    kind: "next",
    town: show.town,
    region: show.department,
    when: formatDateRange(show.date, show.endDate),
    detail: [show.title, show.venue].filter(Boolean).join(" · "),
    externalUrl: show.url,
    geo: show.geo,
    googleMapsUrl: googleMapsSearchUrl(show.town, show.department),
  };
}

/** Upcoming first (soonest first), then home, then the tour in config order. */
export function buildMapPlaces(upcoming: UpcomingShow[] = getUpcomingShows()): MapPlace[] {
  const stops = tourStops.map(fromStop);
  return [
    ...upcoming.map(fromUpcoming),
    ...stops.filter((p) => p.kind === "home"),
    ...stops.filter((p) => p.kind !== "home"),
  ];
}

export type MapFilter = "all" | "next" | "circo" | "edu";

export function matchesFilter(place: MapPlace, filter: MapFilter): boolean {
  if (filter === "all") return true;
  if (filter === "edu") return place.kind === "edu" || place.kind === "home";
  return place.kind === filter;
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Accent-insensitive search over town, region and corregimientos ("tamesis" finds Támesis). */
export function matchesSearch(place: MapPlace, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return [place.town, place.region, ...(place.corregimientos ?? [])].some((text) => fold(text).includes(q));
}
