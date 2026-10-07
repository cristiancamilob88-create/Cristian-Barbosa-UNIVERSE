import { TrackedLink } from "@/components/ui/TrackedLink";
import { siteConfig } from "@/config/site";
import { getUpcomingShows } from "@/config/upcomingShows";
import { personId } from "@/lib/structuredData";
import { formatDateRange } from "@/lib/format";

/**
 * "Próximas fechas" — the agenda (src/config/upcomingShows.ts), with
 * schema.org Event data so Google can list upcoming shows. With no
 * confirmed dates it says so honestly and turns into an invitation to
 * book, instead of an empty "todavía sin publicar" box.
 */
export function UpcomingShows({ topic }: { topic: string }) {
  const shows = getUpcomingShows();

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 border border-[#ffc857]/50 bg-ink-raised p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-[#ffc857]">Próximas fechas</p>
        <p className="max-w-xl text-lg text-chalk">
          Las próximas fechas se anuncian aquí apenas se confirman. ¿Quieres que la próxima sea en tu municipio,
          colegio o evento?
        </p>
        <TrackedLink
          event={{ name: "cta_click", cta: "intent_shows", topic }}
          href="/contacto?topic=shows"
          className="inline-flex w-fit items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk"
        >
          Llevar el show a mi evento
        </TrackedLink>
      </div>
    );
  }

  const eventsJsonLd = shows.map((show) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${siteConfig.name} — ${show.title}`,
    startDate: show.date,
    ...(show.endDate ? { endDate: show.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: show.venue ?? show.town,
      geo: { "@type": "GeoCoordinates", latitude: show.geo.lat, longitude: show.geo.lng },
      address: { "@type": "PostalAddress", addressLocality: show.town, addressRegion: show.department, addressCountry: "CO" },
    },
    performer: { "@id": personId, "@type": "Person", name: siteConfig.name },
    ...(show.url ? { url: show.url } : {}),
  }));

  return (
    <div className="flex flex-col gap-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }} />
      <p className="font-mono text-xs uppercase tracking-widest text-[#ffc857]">Próximas fechas</p>
      <ul className="grid gap-px overflow-hidden border border-[#ffc857]/50 bg-[#ffc857]/30 sm:grid-cols-2">
        {shows.map((show) => (
          <li key={`${show.date}-${show.town}`} className="flex flex-col gap-1 bg-ink-raised p-6">
            <p className="font-mono text-sm text-[#ffc857]">
              {formatDateRange(show.date, show.endDate)}
            </p>
            <p className="font-display text-2xl font-black uppercase tracking-tight text-chalk">
              {show.town} <span className="font-mono text-xs font-normal text-steel-dim">{show.department}</span>
            </p>
            <p className="text-sm text-steel">{[show.title, show.venue].filter(Boolean).join(" · ")}</p>
            {show.url && (
              <a href={show.url} target="_blank" rel="noopener noreferrer" className="mt-2 w-fit text-sm text-chalk underline underline-offset-4 hover:text-ember">
                Más información →
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
