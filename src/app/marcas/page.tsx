import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Marcas",
  description: "Partnerships y colaboraciones de marca con Cristian Barbosa.",
  path: "/marcas",
});

const offerings = [
  "Sponsorship",
  "Partnerships",
  "Campañas",
  "Contenido",
  "Activaciones",
  "Colaboraciones",
  "Eventos",
  "Oportunidades comerciales",
];

export default function MarcasPage() {
  return (
    <>
      <PageHero
        tag="BRANDS"
        title="Marcas"
        description="Audiencia real, formatos flexibles de colaboración — desde contenido puntual hasta partnerships de largo plazo."
      >
        <TrackedLink
          event={{ name: "cta_click", cta: "intent_brands", topic: "marcas" }}
          href="/contacto?topic=marcas"
          className="mt-8 inline-flex w-fit items-center border border-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
        >
          Quiero trabajar con Cristian
        </TrackedLink>
      </PageHero>
      <section className="py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Formatos de colaboración</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {offerings.map((offering) => (
              <span key={offering} className="border border-steel-dim/50 px-4 py-2 text-sm text-steel">
                {offering}
              </span>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
