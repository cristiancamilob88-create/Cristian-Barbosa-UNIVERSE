import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { ShowsMapLazy } from "@/components/shows/ShowsMapLazy";
import { MapLegend } from "@/components/shows/MapLegend";
import { UpcomingShows } from "@/components/shows/UpcomingShows";
import { PastShowCard } from "@/components/shows/PastShowCard";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";
import { pastShows, pastShowsIndexPath } from "@/config/pastShows";
import { circusCountLabel, tourStops } from "@/config/tourStops";

export const metadata: Metadata = buildMetadata({
  title: "Agenda — próximas fechas y dónde se ha presentado",
  description:
    "Dónde va a estar Cristian Barbosa y dónde ya se ha presentado: más de 20 municipios de Antioquia y Chocó con el Circo Santiago de Chile, colegios y alcaldías.",
  path: "/eventos",
});

// Upcoming dates drop off by themselves the day after they end
// (src/config/upcomingShows.ts) — re-render at least daily.
export const revalidate = 86400;

/**
 * The agenda (Cristian, 2026-10-04: "que la gente sepa dónde he estado
 * y dónde voy a estar pronto"). Same data and map as /shows, framed for
 * "when/where": upcoming first, then the full map, then the proof.
 * Replaces the old four empty "todavía sin publicar" boxes.
 */
export default function EventosPage() {
  const schoolsCount = tourStops.filter((stop) => stop.kind === "instituciones").length;
  return (
    <>
      <PageHero
        tag="EVENTS"
        title="Agenda"
        description={`Dónde va a estar Cristian Barbosa y dónde ya se ha presentado: ${circusCountLabel()} municipios de Antioquia y Chocó, colegios y alcaldías.`}
      />
      <section className="py-12">
        <Container>
          <UpcomingShows topic="eventos" />
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-12">
        <Container className="flex flex-col gap-3">
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk">El mapa</h2>
          <ShowsMapLazy />
          <MapLegend />
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-12">
        <Container>
          <div className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
            <div className="bg-ink p-6">
              <p className="font-display text-4xl font-black text-ember">{circusCountLabel()}</p>
              <p className="mt-1 text-sm text-steel">municipios con el Circo Santiago de Chile, desde junio de 2024</p>
            </div>
            <div className="bg-ink p-6">
              <p className="font-display text-4xl font-black text-tide">{schoolsCount}</p>
              <p className="mt-1 text-sm text-steel">ciudades con shows en colegios, alcaldías y eventos — incluido el Pride de Medellín 2022</p>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk">Dónde ha estado</h2>
            <Link href={pastShowsIndexPath} className="text-sm text-steel underline underline-offset-4 hover:text-chalk">
              Ver todos los municipios →
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {pastShows.map((show) => (
              <PastShowCard key={show.slug} show={show} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="max-w-xl text-lg text-chalk">¿Quieres una experiencia así en tu municipio, empresa, colegio o evento?</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <TrackedLink
              event={{ name: "cta_click", cta: "intent_shows", topic: "eventos" }}
              href="/contacto?topic=shows"
              className="inline-flex w-fit items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk"
            >
              Quiero contratar un show
            </TrackedLink>
            <GoLink
              slug={goLinks.whatsappCommercial}
              className="inline-flex w-fit items-center border border-chalk px-6 py-3 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
            >
              Escribir por WhatsApp
            </GoLink>
          </div>
        </Container>
      </section>
    </>
  );
}
