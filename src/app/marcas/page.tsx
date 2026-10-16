import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Marcas y patrocinios",
  description:
    "Patrocinios, embajadorías y colaboraciones de marca con Cristian Barbosa, artista, performer y creador de contenido.",
  path: "/marcas",
});

const offerings = [
  "Patrocinio",
  "Alianzas",
  "Embajador",
  "Campañas",
  "Contenido",
  "Activaciones",
  "Colaboraciones",
  "Eventos",
  "Fitness y estilo de vida",
  "Oportunidades comerciales",
];

/** Confirmed directly by Cristian (docs/MASTER_BRIEF_BLOCK_07_10.md) — no metric/result invented, just the relationship itself. */
const ambassadorships = ["Club Nativos", "Expo Fitness"];

export default function MarcasPage() {
  return (
    <>
      <PageHero
        tag="MARCAS"
        image={{ src: "/brand/show-crowd-01.jpg", alt: "Cristian Barbosa con el público después de un show", position: "object-[50%_30%]" }}
        title="Marcas"
        description="Audiencia real, formatos flexibles de colaboración — desde contenido puntual hasta partnerships de largo plazo."
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <TrackedLink
            event={{ name: "cta_click", cta: "intent_brands", topic: "marcas" }}
            href="/contacto?topic=marcas"
            className="inline-flex w-fit items-center px-6 py-3 text-base font-bold text-ink transition-colors bg-ember hover:bg-chalk focus-visible:bg-chalk"
          >
            Quiero trabajar con Cristian
          </TrackedLink>
          <GoLink
            slug={goLinks.whatsappCommercial}
            className="inline-flex w-fit items-center px-6 py-3 text-base font-bold text-ink transition-colors bg-chalk hover:bg-ember focus-visible:bg-ember"
          >
            Escribir por WhatsApp
          </GoLink>
        </div>
      </PageHero>
      <section className="py-16">
        <Container>
          <p className="text-base text-steel-dim">Formatos de colaboración</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {offerings.map((offering) => (
              <span key={offering} className="px-4 py-2 text-base text-steel bg-ink-raised">
                {offering}
              </span>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <p className="text-base text-steel-dim">Embajador de</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {ambassadorships.map((brand) => (
              <span
                key={brand}
                className="px-4 py-2 text-base font-semibold text-ember bg-ink-raised"
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
