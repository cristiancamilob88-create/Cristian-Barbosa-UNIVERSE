"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { homeBase, pastShowPath, pastShows } from "@/config/pastShows";

/**
 * "Dónde ha estado" — every real show (src/config/pastShows.ts) as a
 * glowing pin on a dark map of Antioquia, plus Envigado as home base.
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

      const points: [number, number][] = [];
      for (const show of pastShows) {
        points.push([show.geo.lat, show.geo.lng]);
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = `${show.town}, ${show.region}`;
        const when = document.createElement("div");
        when.textContent = show.whenLabel;
        const link = document.createElement("a");
        link.href = pastShowPath(show.slug);
        link.textContent = "Ver el show →";
        popup.append(title, when, link);
        L.marker([show.geo.lat, show.geo.lng], { icon: pin("cb-map-pin"), title: show.town, keyboard: true })
          .addTo(map)
          .bindPopup(popup);
      }

      points.push([homeBase.geo.lat, homeBase.geo.lng]);
      const home = document.createElement("div");
      const homeTitle = document.createElement("strong");
      homeTitle.textContent = `${homeBase.town} — base de Cristian`;
      home.append(homeTitle);
      L.marker([homeBase.geo.lat, homeBase.geo.lng], { icon: pin("cb-map-pin cb-map-pin--home"), title: homeBase.town })
        .addTo(map)
        .bindPopup(home);

      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 10 });
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
