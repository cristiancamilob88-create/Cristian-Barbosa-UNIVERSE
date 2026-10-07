"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import {
  buildMapPlaces,
  matchesFilter,
  matchesSearch,
  type MapFilter,
  type MapPlace,
  type PlaceKind,
} from "./mapPlaces";

/**
 * The interactive "dónde ha estado / dónde va a estar" map (Cristian,
 * 2026-10-07: "mejorar el mapa interactivo tipo Google Maps para que la
 * gente pueda revisar las ubicaciones"). Leaflet + CARTO tiles — open
 * source, free, no Google key (his Places key still has no billing) —
 * with what makes Google Maps feel explorable:
 *
 * - filter chips that double as the legend, and an accent-insensitive
 *   search ("tamesis" → Támesis);
 * - a clickable list of every place that flies the map to it;
 * - dark / streets base maps, full-screen mode, "ver toda la gira";
 * - each popup links to the show's own page and opens the town in the
 *   real Google Maps (a plain search link, no API key).
 *
 * Scroll-wheel zoom only turns on after the visitor clicks the map, so
 * scrolling the page past it never gets hijacked.
 */

const PIN_CLASS: Record<PlaceKind, string> = {
  next: "cb-map-pin cb-map-pin--next",
  circo: "cb-map-pin",
  edu: "cb-map-pin cb-map-pin--edu",
  home: "cb-map-pin cb-map-pin--home",
};

const DOT_CLASS: Record<PlaceKind, string> = {
  next: "bg-[#ffc857]",
  circo: "bg-ember",
  edu: "bg-tide",
  home: "bg-chalk",
};

// "Mapa" first and by default (Cristian, 2026-10-07: "como el mapa de
// Google Maps, que se vean los municipios"): CARTO Voyager reads like
// Google's road map — towns, roads, rivers, names at every zoom.
const BASE_LAYERS = {
  streets: {
    label: "Mapa",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  },
  dark: {
    label: "Oscuro",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  },
} as const;

const MAX_ZOOM = 19;
/** From this zoom in, every pin shows its town name, like Google Maps' labels. */
const LABELS_FROM_ZOOM = 9;
type BaseLayer = keyof typeof BASE_LAYERS;

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function popupFor(place: MapPlace): HTMLElement {
  const root = document.createElement("div");
  root.className = "cb-popup";
  const add = (tag: string, text: string, className?: string) => {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    root.append(el);
    return el;
  };

  if (place.kind === "next") add("span", "Próximo show", "cb-popup-tag cb-popup-tag--next");
  add("strong", `${place.town}${place.kind === "home" ? " — base de Cristian" : ""}`, "cb-popup-title");
  add("span", place.region, "cb-popup-region");
  if (place.when) add("span", place.when, "cb-popup-when");
  add("span", place.detail);
  if (place.corregimientos?.length) add("span", `También: ${place.corregimientos.join(", ")}`, "cb-popup-region");

  const links = document.createElement("div");
  links.className = "cb-popup-links";
  const link = (href: string, text: string, external: boolean) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    if (external) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    links.append(a);
  };
  if (place.showPath) link(place.showPath, "Ver el show →", false);
  if (place.externalUrl) link(place.externalUrl, "Más información ↗", true);
  link(place.googleMapsUrl, "Abrir en Google Maps ↗", true);
  root.append(links);
  return root;
}

export function ShowsMap() {
  const places = useMemo(() => buildMapPlaces(), []);
  const counts = useMemo(
    () => ({
      all: places.length,
      next: places.filter((p) => matchesFilter(p, "next")).length,
      circo: places.filter((p) => matchesFilter(p, "circo")).length,
      edu: places.filter((p) => matchesFilter(p, "edu")).length,
    }),
    [places],
  );

  const [filter, setFilter] = useState<MapFilter>("all");
  const [query, setQuery] = useState("");
  const [base, setBase] = useState<BaseLayer>("streets");
  const [fullscreen, setFullscreen] = useState(false);
  const [ready, setReady] = useState(false);

  const host = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const tiles = useRef<Leaflet.TileLayer | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());

  const visible = useMemo(
    () => places.filter((p) => matchesFilter(p, filter) && matchesSearch(p, query)),
    [places, filter, query],
  );

  // Create the map once.
  useEffect(() => {
    let disposed = false;
    const markerStore = markers.current;

    (async () => {
      const L = await import("leaflet");
      if (disposed || !host.current) return;
      leaflet.current = L;

      const m = L.map(host.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
        maxZoom: MAX_ZOOM,
      });
      map.current = m;
      // Google-Maps-like: wheel zoom once the visitor engages with the map.
      m.on("click", () => m.scrollWheelZoom.enable());
      m.on("mouseout", () => m.scrollWheelZoom.disable());

      for (const place of places) {
        const marker = L.marker([place.geo.lat, place.geo.lng], {
          icon: L.divIcon({
            className: "",
            html: `<span class="${PIN_CLASS[place.kind]}"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
          title: place.town,
          keyboard: true,
          zIndexOffset: place.kind === "next" ? 1000 : 0,
        })
          .bindPopup(() => popupFor(place), { maxWidth: 260 })
          .bindTooltip(place.town, { direction: "top", offset: [0, -10], className: "cb-map-tooltip" });
        markerStore.set(place.id, marker);
      }

      // Zoomed in, every town name stays visible; zoomed out, names only
      // on hover so 27 labels don't pile on top of each other.
      let labelsShown = false;
      m.on("zoomend", () => {
        const show = m.getZoom() >= LABELS_FROM_ZOOM;
        if (show === labelsShown) return;
        labelsShown = show;
        for (const [id, marker] of markerStore) {
          const town = places.find((p) => p.id === id)?.town ?? "";
          marker.unbindTooltip().bindTooltip(town, {
            direction: "top",
            offset: [0, -10],
            className: "cb-map-tooltip",
            permanent: show,
          });
        }
      });
      setReady(true);
    })();

    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      markerStore.clear();
    };
  }, [places]);

  // Base layer.
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    if (!ready || !L || !m) return;
    tiles.current?.remove();
    tiles.current = L.tileLayer(BASE_LAYERS[base].url, { subdomains: "abcd", maxZoom: MAX_ZOOM, attribution: ATTRIBUTION }).addTo(m);
  }, [ready, base]);

  // Show only the filtered/searched pins, and frame them.
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    if (!ready || !L || !m) return;
    const ids = new Set(visible.map((p) => p.id));
    for (const [id, marker] of markers.current) {
      if (ids.has(id)) marker.addTo(m);
      else marker.remove();
    }
    if (visible.length === 0) return;
    // The whole tour frames Antioquia + Chocó; Bogotá/Fusagasugá stay a
    // pan away rather than zooming everything out to Cundinamarca.
    const framed = filter === "all" && !query ? visible.filter((p) => p.geo.lat > 5) : visible;
    m.fitBounds(L.latLngBounds((framed.length ? framed : visible).map((p) => [p.geo.lat, p.geo.lng])), {
      padding: [36, 36],
      maxZoom: visible.length === 1 ? 12 : 10,
    });
  }, [ready, visible, filter, query]);

  // Full screen: a fixed overlay (works on iPhone too, unlike the
  // Fullscreen API); Leaflet must re-measure after the resize.
  useEffect(() => {
    map.current?.invalidateSize();
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  function focusPlace(place: MapPlace) {
    const m = map.current;
    const marker = markers.current.get(place.id);
    if (!m || !marker) return;
    if (!fullscreen) shell.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    m.flyTo([place.geo.lat, place.geo.lng], 12, { duration: 0.8 });
    m.once("moveend", () => marker.openPopup());
  }

  function showAll() {
    setFilter("all");
    setQuery("");
    map.current?.closePopup();
  }

  const chips: { value: MapFilter; label: string; dot?: PlaceKind }[] = [
    { value: "all", label: "Todos" },
    ...(counts.next ? [{ value: "next" as const, label: "Próximos shows", dot: "next" as const }] : []),
    { value: "circo", label: "Gira con el circo", dot: "circo" },
    { value: "edu", label: "Colegios y alcaldías", dot: "edu" },
  ];

  return (
    <div
      ref={shell}
      className={
        fullscreen
          ? "fixed inset-0 z-[60] flex flex-col gap-3 bg-ink p-3 sm:p-4"
          : "flex scroll-mt-24 flex-col gap-3"
      }
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            aria-pressed={filter === chip.value}
            onClick={() => setFilter(chip.value)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === chip.value ? "border-chalk bg-chalk text-ink" : "border-steel-dim/50 text-steel hover:text-chalk"
            }`}
          >
            {chip.dot && <span className={`h-2.5 w-2.5 rounded-full ${DOT_CLASS[chip.dot]}`} aria-hidden="true" />}
            {chip.label}
            <span className="font-mono opacity-70">{counts[chip.value]}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-steel-dim/50 text-xs font-semibold" role="group" aria-label="Tipo de mapa">
            {(Object.keys(BASE_LAYERS) as BaseLayer[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={base === key}
                onClick={() => setBase(key)}
                className={`px-3 py-1.5 transition-colors ${base === key ? "bg-chalk text-ink" : "text-steel hover:text-chalk"}`}
              >
                {BASE_LAYERS[key].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            className="rounded-full border border-steel-dim/50 px-3 py-1.5 text-xs font-semibold text-steel transition-colors hover:text-chalk"
          >
            {fullscreen ? "Cerrar ✕" : "Pantalla completa ⤢"}
          </button>
        </div>
      </div>

      {/* Map + list */}
      <div className={`grid gap-3 lg:grid-cols-[1fr_300px] ${fullscreen ? "min-h-0 flex-1" : ""}`}>
        <div className={`relative ${fullscreen ? "min-h-[50vh]" : ""}`}>
          <div
            ref={host}
            role="region"
            aria-label="Mapa interactivo de los lugares donde Cristian Barbosa se ha presentado"
            className={`cb-shows-map w-full border border-steel-dim/40 bg-ink-raised ${
              fullscreen ? "h-full" : "h-[420px] sm:h-[520px]"
            }`}
          />
          <button
            type="button"
            onClick={showAll}
            className="absolute right-3 top-3 z-[500] rounded-full border border-steel-dim/50 bg-ink/90 px-3 py-1.5 text-xs font-semibold text-chalk shadow-lg hover:text-ember"
          >
            Ver toda la gira
          </button>
        </div>

        <div className={`flex min-h-0 flex-col border border-steel-dim/40 bg-ink-raised ${fullscreen ? "max-h-[35vh] lg:max-h-none" : "lg:h-[520px]"}`}>
          <label className="border-b border-steel-dim/40 p-3">
            <span className="sr-only">Buscar un municipio</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar municipio…"
              className="w-full bg-ink px-3 py-2 text-sm text-chalk placeholder:text-steel-dim focus:outline focus:outline-1 focus:outline-ember"
            />
          </label>
          <p className="px-3 pt-2 font-mono text-[0.65rem] uppercase tracking-widest text-steel-dim">
            {visible.length} {visible.length === 1 ? "lugar" : "lugares"}
          </p>
          <ul className={`min-h-0 flex-1 overflow-y-auto p-2 ${fullscreen ? "" : "max-h-64 lg:max-h-none"}`}>
            {visible.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => focusPlace(place)}
                  className="flex w-full items-start gap-3 px-2 py-2 text-left transition-colors hover:bg-ink"
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASS[place.kind]}`} aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-chalk">{place.town}</span>
                    <span className="text-xs text-steel">{place.when ?? place.region}</span>
                  </span>
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="px-2 py-4 text-sm text-steel">Ningún lugar coincide con la búsqueda.</li>}
          </ul>
        </div>
      </div>
      {!fullscreen && (
        <p className="text-xs text-steel-dim">Toca un pin o un municipio de la lista para ver qué pasó ahí. Acércate con dos dedos (o con + / −) para ver cada municipio; en computador, haz clic en el mapa y usa la rueda del ratón.</p>
      )}
    </div>
  );
}
