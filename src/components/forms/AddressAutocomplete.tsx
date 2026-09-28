"use client";

import { useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { toEventAddress, type EventAddress } from "@/lib/eventAddress";

/**
 * "¿Dónde es el evento?" for the shows request form — Google Maps
 * address autocomplete (Places API New, restricted to Colombia) with a
 * dark map + marker, filling city / department / postal code / country
 * and keeping the coordinates. Adapted from the Google Maps Platform
 * "address selection" snippet Cristian brought (2026-09-28): same
 * fields and map, but the current API (the snippet's legacy
 * Autocomplete isn't available to new keys) and the site's own look
 * instead of the snippet's white card.
 *
 * Without NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, or if Google fails to load,
 * it degrades to one plain text field — the form never breaks and the
 * place still reaches the lead (as `line` only).
 */

const inputClass =
  "w-full border border-steel-dim/50 bg-transparent px-4 py-3 text-chalk placeholder:text-steel-dim focus:border-ember focus:outline-none";
const readOnlyClass = "w-full border border-steel-dim/30 bg-ink-raised px-4 py-3 text-sm text-steel";
const labelClass = "font-mono text-xs uppercase tracking-widest text-steel";

// Envigado — where Cristian is based; the map's starting view.
const DEFAULT_CENTER = { lat: 6.1759, lng: -75.5917 };

type Mode = "loading" | "maps" | "fallback";

export function AddressAutocomplete({ onChange }: { onChange: (address: EventAddress | null) => void }) {
  const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mode, setMode] = useState<Mode>(apiKey ? "loading" : "fallback");
  const [address, setAddress] = useState<EventAddress | null>(null);
  const [detail, setDetail] = useState("");
  const [notFound, setNotFound] = useState(false);
  const autocompleteHost = useRef<HTMLDivElement>(null);
  const mapHost = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const detailRef = useRef(detail);

  useEffect(() => {
    onChangeRef.current = onChange;
    detailRef.current = detail;
  });

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    let map: google.maps.Map | null = null;
    let marker: google.maps.marker.AdvancedMarkerElement | null = null;
    let element: HTMLElement | null = null;

    async function init() {
      await loadGoogleMaps(apiKey!);
      const [{ PlaceAutocompleteElement }, { Map }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary("places") as Promise<google.maps.PlacesLibrary>,
        google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
        google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
      ]);
      if (cancelled || !autocompleteHost.current || !mapHost.current) return;

      const autocomplete = new PlaceAutocompleteElement({ includedRegionCodes: ["co"] });
      autocomplete.id = "event-address";
      autocomplete.style.colorScheme = "dark";
      autocomplete.style.width = "100%";
      autocompleteHost.current.replaceChildren(autocomplete);
      element = autocomplete;

      map = new Map(mapHost.current, {
        center: DEFAULT_CENTER,
        zoom: 11,
        mapId: env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
        disableDefaultUI: true,
        zoomControl: true,
        colorScheme: "DARK",
      } as google.maps.MapOptions);
      marker = new AdvancedMarkerElement({ map });

      const handleSelect = async (event: Event) => {
        // Current API: `gmp-select` carries a placePrediction; older
        // releases fired `gmp-placeselect` with a ready `place`.
        const detailEvent = event as Event & {
          placePrediction?: { toPlace: () => google.maps.places.Place };
          place?: google.maps.places.Place;
        };
        const place = detailEvent.placePrediction?.toPlace() ?? detailEvent.place;
        if (!place) return;
        await place.fetchFields({ fields: ["addressComponents", "location", "formattedAddress", "id"] });
        if (!place.location) {
          setNotFound(true);
          return;
        }
        setNotFound(false);
        const next = toEventAddress({
          components: (place.addressComponents ?? []).map((c) => ({
            longText: c.longText,
            shortText: c.shortText,
            types: c.types,
          })),
          formattedAddress: place.formattedAddress,
          latitude: place.location.lat(),
          longitude: place.location.lng(),
          placeId: place.id,
        });
        map?.setCenter(place.location);
        map?.setZoom(16);
        if (marker) marker.position = place.location;
        setAddress(next);
        onChangeRef.current({ ...next, detail: detailRef.current.trim() || undefined });
      };
      autocomplete.addEventListener("gmp-select", handleSelect);
      autocomplete.addEventListener("gmp-placeselect", handleSelect);
      setMode("maps");
    }

    init().catch(() => {
      if (!cancelled) setMode("fallback");
    });
    return () => {
      cancelled = true;
      element?.remove();
      if (marker) marker.map = null;
    };
  }, [apiKey]);

  function updateDetail(value: string) {
    setDetail(value);
    if (address) onChange({ ...address, detail: value.trim() || undefined });
  }

  if (mode === "fallback") {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor="event-address-text" className={labelClass}>
          ¿Dónde es el evento? (opcional)
        </label>
        <input
          id="event-address-text"
          type="text"
          maxLength={200}
          placeholder="Municipio, lugar o dirección"
          className={inputClass}
          onChange={(e) => {
            const line = e.target.value.trim();
            onChange(line.length >= 3 ? { line } : null);
          }}
        />
      </div>
    );
  }

  return (
    <fieldset className="flex flex-col gap-3 border border-steel-dim/40 p-4">
      <legend className={`${labelClass} px-2`}>¿Dónde es el evento? (opcional)</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label htmlFor="event-address" className="sr-only">
            Busca la dirección o el lugar del evento
          </label>
          <div ref={autocompleteHost} className="min-h-[46px] border border-steel-dim/50 focus-within:border-ember">
            {mode === "loading" && <p className="px-4 py-3 text-sm text-steel-dim">Cargando buscador de direcciones…</p>}
          </div>
          {notFound && (
            <p role="alert" className="text-sm text-ember">
              No encontramos ese lugar en el mapa. Prueba con otra dirección o el nombre del sitio.
            </p>
          )}
          <input
            type="text"
            value={detail}
            maxLength={120}
            onChange={(e) => updateDetail(e.target.value)}
            placeholder="Salón, apto, oficina o referencia (opcional)"
            aria-label="Salón, apto, oficina o referencia"
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-3">
            <input readOnly tabIndex={-1} aria-label="Ciudad" placeholder="Ciudad" value={address?.city ?? ""} className={readOnlyClass} />
            <input readOnly tabIndex={-1} aria-label="Departamento" placeholder="Departamento" value={address?.region ?? ""} className={readOnlyClass} />
            <input readOnly tabIndex={-1} aria-label="Código postal" placeholder="Código postal" value={address?.postalCode ?? ""} className={readOnlyClass} />
            <input readOnly tabIndex={-1} aria-label="País" placeholder="País" value={address?.country ?? ""} className={readOnlyClass} />
          </div>
        </div>
        <div ref={mapHost} aria-hidden="true" className="h-56 min-h-full w-full border border-steel-dim/40 bg-ink-raised sm:h-auto" />
      </div>
    </fieldset>
  );
}
