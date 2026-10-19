"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildMapPlaces, matchesSearch, type MapPlace } from "@/components/shows/mapPlaces";
import { agendaHref } from "@/config/site";
import { track } from "@/lib/analytics";

/**
 * "¿Ya estuvo en tu pueblo?" — the homepage's one live thing (taste-skill
 * redesign, 2026-10-16). A visitor types their town and gets a real
 * answer from the tour list (src/config/tourStops.ts): yes, with what
 * happened there, or not yet, with the button to bring the show. The
 * whole tour list stays one link away on /agenda for anyone without JS.
 * What they typed is recorded as a `map_interaction` (town_check) once
 * they stop typing, same as the map's own search.
 */
function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function TownCheck() {
  const places = useMemo(() => buildMapPlaces([]), []);
  const [query, setQuery] = useState("");
  const q = fold(query);

  let match: MapPlace | undefined;
  if (q.length >= 3) {
    match = places.find((place) => fold(place.town) === q) ?? places.find((place) => matchesSearch(place, query));
  }

  const lastRecorded = useRef("");
  const typed = query.trim().slice(0, 60);
  const matchedTown = match?.town;
  useEffect(() => {
    if (typed.length < 3 || typed === lastRecorded.current) return;
    const timer = setTimeout(() => {
      lastRecorded.current = typed;
      track({ name: "map_interaction", action: "town_check", town: matchedTown ?? typed, query: typed, found: Boolean(matchedTown) });
    }, 1500);
    return () => clearTimeout(timer);
  }, [typed, matchedTown]);

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-3">
        <span className="text-lg text-chalk">Escribe tu municipio</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej.: Sopetrán"
          autoComplete="off"
          className="w-full bg-ink-raised px-5 py-4 font-display text-3xl font-black uppercase tracking-tight text-chalk placeholder:text-steel-dim focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ember sm:text-4xl"
        />
      </label>

      <div aria-live="polite" className="min-h-[7rem] text-lg leading-relaxed text-chalk">
        {q.length < 3 ? (
          <p className="text-steel">
            Ya se ha presentado en más de 20 municipios de Antioquia y Chocó, y en colegios y alcaldías de cinco
            ciudades.
          </p>
        ) : match ? (
          <div className="flex flex-col gap-3">
            <p>
              <strong className="text-ember">Sí.</strong> Cristian ya estuvo en {match.town} ({match.region}).{" "}
              {match.detail}
            </p>
            <Link href={match.showPath ?? agendaHref} className="w-fit font-semibold text-chalk underline underline-offset-4 transition-colors hover:text-ember">
              {match.showPath ? "Ver ese show" : "Verlo en el mapa de la gira"}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p>
              <strong className="text-ember">Todavía no.</strong> {query.trim()} puede ser la próxima parada.
            </p>
            <Link
              href={`/contacto?topic=shows`}
              className="w-fit bg-ember px-6 py-3 font-semibold text-ink transition-colors hover:bg-chalk"
            >
              Llevar el show a {query.trim()}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
