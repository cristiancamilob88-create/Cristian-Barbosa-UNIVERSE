/**
 * Every place Cristian has performed — his own list (2026-10-04), the
 * source for the "Dónde ha estado" map and the tour list on
 * /shows/realizados. Lighter than src/config/pastShows.ts on purpose: a
 * stop is just "he performed here"; a stop gets its own page there
 * once there are real details/photos for it (`showSlug` links them).
 *
 * Coordinates are each municipality's urban center (public geographic
 * fact, rounded) — the pin says "this town", never an exact venue.
 * Corregimientos sit under their municipality and share its pin.
 */

export type StopKind = "circo" | "instituciones";

export interface TourStop {
  /** Municipality name, as written in Colombia. */
  town: string;
  department: "Antioquia" | "Chocó" | "Cundinamarca" | "Bogotá D.C.";
  /** Antioquia subregion (or a plain label outside Antioquia). */
  subregion: string;
  kind: StopKind;
  geo: { lat: number; lng: number };
  /** Corregimientos of this municipality where he also performed. */
  corregimientos?: string[];
  /** What happened there, when it's more than "show with the circus". */
  note?: string;
  /** src/config/pastShows.ts slug, when the show has its own page. */
  showSlug?: string;
}

export const tourStops: TourStop[] = [
  // Gira con el Circo Santiago de Chile — Suroeste (+ El Carmen de Atrato, Chocó)
  { town: "El Carmen de Atrato", department: "Chocó", subregion: "Chocó", kind: "circo", geo: { lat: 5.899, lng: -76.143 } },
  { town: "Ciudad Bolívar", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 5.851, lng: -76.021 }, corregimientos: ["Farallones del Citará"] },
  { town: "Andes", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 5.657, lng: -75.879 }, corregimientos: ["Tapartó"] },
  { town: "Venecia", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 5.965, lng: -75.735 }, corregimientos: ["Bolombolo"] },
  { town: "Fredonia", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 5.928, lng: -75.674 } },
  { town: "Angelópolis", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 6.11, lng: -75.711 } },
  { town: "Titiribí", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 6.062, lng: -75.792 } },
  { town: "Pueblorrico", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 5.792, lng: -75.84 } },
  { town: "Salgar", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 5.964, lng: -75.977 } },
  { town: "Betulia", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 6.115, lng: -75.984 } },
  { town: "Urrao", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 6.317, lng: -76.134 } },
  { town: "Támesis", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 5.664, lng: -75.714 }, showSlug: "tamesis-2026" },
  { town: "Concordia", department: "Antioquia", subregion: "Suroeste", kind: "circo", geo: { lat: 6.046, lng: -75.908 }, showSlug: "concordia-2026" },
  // Nordeste y Norte
  { town: "Segovia", department: "Antioquia", subregion: "Nordeste", kind: "circo", geo: { lat: 7.08, lng: -74.702 } },
  { town: "Yalí", department: "Antioquia", subregion: "Nordeste", kind: "circo", geo: { lat: 6.677, lng: -74.84 } },
  { town: "Yolombó", department: "Antioquia", subregion: "Nordeste", kind: "circo", geo: { lat: 6.598, lng: -75.013 } },
  { town: "Amalfi", department: "Antioquia", subregion: "Nordeste", kind: "circo", geo: { lat: 6.909, lng: -75.077 } },
  { town: "Yarumal", department: "Antioquia", subregion: "Norte", kind: "circo", geo: { lat: 6.963, lng: -75.418 } },
  // Occidente
  { town: "Giraldo", department: "Antioquia", subregion: "Occidente", kind: "circo", geo: { lat: 6.681, lng: -75.952 } },
  { town: "Frontino", department: "Antioquia", subregion: "Occidente", kind: "circo", geo: { lat: 6.776, lng: -76.131 } },
  { town: "Santa Fe de Antioquia", department: "Antioquia", subregion: "Occidente", kind: "circo", geo: { lat: 6.557, lng: -75.828 } },
  { town: "Ebéjico", department: "Antioquia", subregion: "Occidente", kind: "circo", geo: { lat: 6.326, lng: -75.768 }, corregimientos: ["Sevilla"] },

  // Instituciones educativas, alcaldías y eventos
  { town: "Medellín", department: "Antioquia", subregion: "Valle de Aburrá", kind: "instituciones", geo: { lat: 6.244, lng: -75.581 }, note: "Pride 2022 frente a más de 80.000 personas, invitado por la Alcaldía, y presentaciones en colegios junto al artista El Oscar." },
  { town: "Envigado", department: "Antioquia", subregion: "Valle de Aburrá", kind: "instituciones", geo: { lat: 6.172, lng: -75.587 }, note: "Su base. Presentaciones con la Alcaldía, en varios colegios y en Club Nativos." },
  { town: "San Rafael", department: "Antioquia", subregion: "Oriente", kind: "instituciones", geo: { lat: 6.294, lng: -75.028 }, note: "Presentaciones con la Alcaldía de San Rafael." },
  { town: "Bogotá", department: "Bogotá D.C.", subregion: "Cundinamarca", kind: "instituciones", geo: { lat: 4.624, lng: -74.19 }, note: "Colegios de Bosa El Porvenir." },
  { town: "Fusagasugá", department: "Cundinamarca", subregion: "Cundinamarca", kind: "instituciones", geo: { lat: 4.337, lng: -74.364 }, note: "Donde creció: presentaciones en colegios." },
];

export const circusStops = tourStops.filter((stop) => stop.kind === "circo");

/** Municipalities (not counting corregimientos) visited with the circus. */
export const circusMunicipalityCount = circusStops.length;

/** "más de 20" — rounded down to the nearest 5, so the copy never overstates. */
export function circusCountLabel(): string {
  return `más de ${Math.floor(circusMunicipalityCount / 5) * 5}`;
}

/** Ordered subregion groups for the tour list. */
export function groupBySubregion(stops: TourStop[]): { subregion: string; stops: TourStop[] }[] {
  const groups = new Map<string, TourStop[]>();
  for (const stop of stops) {
    groups.set(stop.subregion, [...(groups.get(stop.subregion) ?? []), stop]);
  }
  return [...groups.entries()].map(([subregion, list]) => ({ subregion, stops: list }));
}
