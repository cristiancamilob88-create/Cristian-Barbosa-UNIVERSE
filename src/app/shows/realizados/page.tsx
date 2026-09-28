import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { PastShowCard } from "@/components/shows/PastShowCard";
import { buildMetadata } from "@/lib/seo";
import { pastShows, pastShowsIndexPath } from "@/config/pastShows";

export const metadata: Metadata = buildMetadata({
  title: "Shows realizados en Antioquia",
  description:
    "Los shows que Cristian Barbosa ya ha presentado en Antioquia: Támesis, Concordia y más. Mira dónde ha estado y contrata el tuyo.",
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
      <section className="py-16">
        <Container className="grid gap-6 sm:grid-cols-2">
          {pastShows.map((show) => (
            <PastShowCard key={show.slug} show={show} />
          ))}
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
