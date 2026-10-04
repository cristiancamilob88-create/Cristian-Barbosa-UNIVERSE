import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { PastShowCard } from "@/components/shows/PastShowCard";
import { buildMetadata } from "@/lib/seo";
import { pastShowPath, pastShows, pastShowsIndexPath } from "@/config/pastShows";
import { circusCountLabel, circusStops, groupBySubregion, tourStops } from "@/config/tourStops";
import Link from "next/link";
import { ShowsMapLazy } from "@/components/shows/ShowsMapLazy";
import { MapLegend } from "@/components/shows/MapLegend";

export const metadata: Metadata = buildMetadata({
  title: "Shows realizados en Antioquia — más de 20 municipios",
  description:
    "Dónde se ha presentado Cristian Barbosa: gira con el Circo Santiago de Chile por el Suroeste, Nordeste, Norte y Occidente de Antioquia y Chocó, y shows en colegios y alcaldías.",
  path: pastShowsIndexPath,
});

export default function ShowsRealizadosPage() {
  return (
    <>
      <PageHero
        tag="SHOWS"
        title="Shows realizados"
        description="Dónde ha estado Cristian Barbosa — municipios, eventos y escenarios reales de Antioquia."
      />
      <section className="pt-16">
        <Container className="flex flex-col gap-3">
          <ShowsMapLazy />
          <MapLegend />
        </Container>
      </section>
      <section className="py-16">
        <Container className="grid gap-6 sm:grid-cols-2">
          {pastShows.map((show) => (
            <PastShowCard key={show.slug} show={show} />
          ))}
        </Container>
      </section>
      {/* The full list as text — what search engines actually read. */}
      <section className="border-t border-steel-dim/40 py-16">
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
              {tourStops
                .filter((stop) => stop.kind === "instituciones")
                .map((stop) => (
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
      <section className="border-t border-steel-dim/40 py-16">
        <Container className="flex flex-col items-start gap-4">
          <p className="text-lg text-chalk">¿Quieres que el próximo sea en tu municipio, colegio o evento?</p>
          <TrackedLink
            event={{ name: "cta_click", cta: "intent_shows", topic: "shows_realizados" }}
            href="/contacto?topic=shows"
            className="inline-flex w-fit items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk"
          >
            Quiero contratar un show
          </TrackedLink>
        </Container>
      </section>
    </>
  );
}
