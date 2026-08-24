import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Marcas",
  description: "Partnerships y colaboraciones de marca con Cristian Barbosa.",
  path: "/marcas",
});

const offerings = [
  "Sponsorship",
  "Partnerships",
  "Embajador",
  "Campañas",
  "Contenido",
  "Activaciones",
  "Colaboraciones",
  "Eventos",
  "Fitness / lifestyle",
  "Oportunidades comerciales",
];

/** Confirmed directly by Cristian (docs/MASTER_BRIEF_BLOCK_07_10.md) — no metric/result invented, just the relationship itself. */
const ambassadorships = ["Club Nativos", "Expo Fitness"];

export default function MarcasPage() {
  return (
    <>
      <PageHero
        tag="BRANDS"
        title="Marcas"
        description="Audiencia real, formatos flexibles de colaboración — desde contenido puntual hasta partnerships de largo plazo."
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <TrackedLink
            event={{ name: "cta_click", cta: "intent_brands", topic: "marcas" }}
            href="/contacto?topic=marcas"
            className="inline-flex w-fit items-center border border-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
          >
            Quiero trabajar con Cristian
          </TrackedLink>
          <GoLink
            slug={goLinks.whatsappCommercial}
            className="inline-flex w-fit items-center border border-chalk px-6 py-3 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
          >
            Escribir por WhatsApp
          </GoLink>
        </div>
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
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Embajador de</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {ambassadorships.map((brand) => (
              <span
                key={brand}
                className="border border-ember/50 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-ember"
              >
                {brand}
              </span>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
