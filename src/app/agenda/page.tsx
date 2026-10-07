import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { ShowsMapLazy } from "@/components/shows/ShowsMapLazy";
import { UpcomingShows } from "@/components/shows/UpcomingShows";
import { getUpcomingShows } from "@/config/upcomingShows";
import { PastShowCard } from "@/components/shows/PastShowCard";
import { buildMetadata } from "@/lib/seo";
import { performedPlacesJsonLd } from "@/lib/structuredData";
import { agendaHref, goLinks, siteConfig } from "@/config/site";
import { pastShowPath, pastShows } from "@/config/pastShows";
import { circusCountLabel, circusStops, groupBySubregion, tourStops } from "@/config/tourStops";

export const metadata: Metadata = buildMetadata({
  title: "Agenda de shows — próximas fechas y dónde se ha presentado",
  description:
    "Dónde va a estar Cristian Barbosa y dónde ya se ha presentado: más de 20 municipios de Antioquia y Chocó con el Circo Santiago de Chile, colegios y alcaldías. Mapa completo de la gira.",
  path: agendaHref,
});

// Upcoming dates drop off by themselves the day after they end
// (src/config/upcomingShows.ts) — re-render at least daily.
export const revalidate = 86400;

/**
 * The one shareable link for shows (Cristian, 2026-10-07: "una cosa es
 * dónde he estado y cuál va a ser el próximo show… requerimos de un
 * link para compartirlo en las redes"). Merges what used to be split
 * across /eventos (upcoming + map) and /shows/realizados (full list);
 * both now redirect here. Order answers a fan's questions in turn:
 * when's the next one → where has he been → I want one in my town.
 * /shows is the separate page for organizers hiring a show.
 */
export default function AgendaPage() {
  const institutionStops = tourStops.filter((stop) => stop.kind === "instituciones");
  const hasUpcoming = getUpcomingShows().length > 0;
  const upcomingSection = (
      <section className="border-t border-steel-dim/40 py-12">
        <Container>
          <UpcomingShows topic="agenda" />
        </Container>
      </section>
  );
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(performedPlacesJsonLd(tourStops, new URL(agendaHref, siteConfig.url).toString())),
        }}
      />
      <PageHero
        tag="AGENDA"
        title="Agenda"
        description={`El próximo show de Cristian Barbosa y todos los lugares donde ya se ha presentado: ${circusCountLabel()} municipios de Antioquia y Chocó, colegios y alcaldías.`}
      />

      {/* 1. With a confirmed date, the next show leads; without one, the
          map does (2026-10-07: "quiero ver ese mapa") and the "no dates
          yet — book one" card follows it. */}
      {hasUpcoming && upcomingSection}

      {/* 2. Dónde ha estado: mapa + cifras */}
      <section id="mapa" className="scroll-mt-20 border-t border-steel-dim/40 py-12">
        <Container className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">Dónde ha estado</p>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk">El mapa de la gira</h2>
          <ShowsMapLazy />
          <div className="mt-6 grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
            <div className="bg-ink p-6">
              <p className="font-display text-4xl font-black text-ember">{circusCountLabel()}</p>
              <p className="mt-1 text-sm text-steel">municipios con el Circo Santiago de Chile, desde junio de 2024</p>
            </div>
            <div className="bg-ink p-6">
              <p className="font-display text-4xl font-black text-tide">{institutionStops.length}</p>
              <p className="mt-1 text-sm text-steel">ciudades con shows en colegios, alcaldías y eventos — incluido el Pride de Medellín 2022</p>
            </div>
          </div>
        </Container>
      </section>

      {!hasUpcoming && upcomingSection}

      {/* 3. Shows con su propia página (fotos e historia) */}
      <section className="border-t border-steel-dim/40 py-12">
        <Container>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk">Shows destacados</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {pastShows.map((show) => (
              <PastShowCard key={show.slug} show={show} />
            ))}
          </div>
        </Container>
      </section>

      {/* 4. La lista completa como texto — lo que Google lee. */}
      <section className="border-t border-steel-dim/40 py-12">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-chalk">
              Gira con el Circo Santiago de Chile
            </h2>
            <p className="mt-2 text-sm text-steel">
              {circusCountLabel()} municipios desde junio de 2024, cuatro noches por municipio en el coliseo cubierto.
            </p>
            <div className="mt-6 flex flex-col gap-6">
              {groupBySubregion(circusStops).map((group) => (
                <div key={group.subregion}>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-ember">{group.subregion}</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {group.stops.map((stop) => (
                      <li key={stop.town} className="border border-steel-dim/50 px-3 py-1 text-sm text-chalk">
                        {stop.showSlug ? (
                          <Link href={pastShowPath(stop.showSlug)} className="underline decoration-ember underline-offset-4 hover:text-ember">
                            {stop.town}
                          </Link>
                        ) : (
                          stop.town
                        )}
                        {stop.corregimientos?.length ? (
                          <span className="text-steel"> · {stop.corregimientos.join(", ")}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-chalk">
              Colegios, alcaldías y eventos
            </h2>
            <ul className="mt-6 flex flex-col gap-4">
              {institutionStops.map((stop) => (
                <li key={stop.town} className="border-l-2 border-tide pl-4">
                  <p className="font-display text-lg font-black uppercase tracking-tight text-chalk">
                    {stop.town} <span className="font-mono text-xs font-normal text-steel-dim">{stop.department}</span>
                  </p>
                  {stop.note && <p className="mt-1 text-sm text-steel">{stop.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* 5. ¿El próximo en tu municipio? */}
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="max-w-xl text-lg text-chalk">¿Quieres que el próximo show sea en tu municipio, empresa, colegio o evento?</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <TrackedLink
              event={{ name: "cta_click", cta: "intent_shows", topic: "agenda" }}
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
