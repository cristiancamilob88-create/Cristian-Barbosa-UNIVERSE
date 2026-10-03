"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { pastShowPath } from "@/config/pastShows";
import { tourStops } from "@/config/tourStops";

/**
 * "Dónde ha estado" — every place he has performed
 * (src/config/tourStops.ts): circus tour stops in ember, schools/
 * alcaldías in tide, Envigado (home) in chalk, on a dark map.
 * Cristian's ask (2026-10-02): our own map, no Google Maps key needed.
 *
 * Leaflet (open source, ~40 KB) + CARTO's dark OpenStreetMap tiles
 * (free, attribution shown, as their terms require). Loaded in the
 * browser only. Each pin opens a popup linking to that show's page.
 * The map is decoration on top of what Google actually reads: each
 * show page's Event structured data already carries town + coordinates.
 */
export function ShowsMap() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | null = null;

    (async () => {
      const L = await import("leaflet");
      if (disposed || !host.current) return;

      map = L.map(host.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      const pin = (className: string) =>
        L.divIcon({ className: "", html: `<span class="${className}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });

      // Frame Antioquia + Chocó; Bogotá/Fusagasugá stay reachable by
      // panning instead of zooming the whole map out to Cundinamarca.
      const points: [number, number][] = [];
      for (const stop of tourStops) {
        const home = stop.town === "Envigado";
        const className = home ? "cb-map-pin cb-map-pin--home" : stop.kind === "circo" ? "cb-map-pin" : "cb-map-pin cb-map-pin--edu";
        if (stop.department === "Antioquia" || stop.department === "Chocó") points.push([stop.geo.lat, stop.geo.lng]);

        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = `${stop.town}${home ? " — base de Cristian" : ""}`;
        const where = document.createElement("div");
        where.textContent = `${stop.subregion === stop.department ? stop.department : `${stop.subregion}, ${stop.department}`}`;
        const what = document.createElement("div");
        what.textContent = stop.note ?? "Gira con el Circo Santiago de Chile";
        popup.append(title, where, what);
        if (stop.corregimientos?.length) {
          const extra = document.createElement("div");
          extra.textContent = `También: ${stop.corregimientos.join(", ")}`;
          popup.append(extra);
        }
        if (stop.showSlug) {
          const link = document.createElement("a");
          link.href = pastShowPath(stop.showSlug);
          link.textContent = "Ver el show →";
          popup.append(link);
        }
        L.marker([stop.geo.lat, stop.geo.lng], { icon: pin(className), title: stop.town, keyboard: true })
          .addTo(map)
          .bindPopup(popup);
      }

      map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 10 });
    })();

    return () => {
      disposed = true;
      map?.remove();
    };
  }, []);

  return (
    <div
      ref={host}
      role="region"
      aria-label="Mapa de los municipios donde Cristian Barbosa se ha presentado"
      className="cb-shows-map h-[380px] w-full border border-steel-dim/40 bg-ink-raised sm:h-[460px]"
    />
  );
}
