import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Shows",
  description:
    "Shows en vivo de Cristian Barbosa para empresas, colegios, ferias, festivales, productoras y eventos privados o masivos.",
  path: "/shows",
});

const audiences = [
  "Empresas",
  "Colegios",
  "Ferias",
  "Festivales",
  "Productoras",
  "Eventos privados",
  "Quince años",
  "Rooftops",
  "Eventos masivos",
  "Circo / espectáculos",
];

/**
 * Starting packages, not 15 finished PDF proposals yet (docs/
 * MASTER_BRIEF_BLOCK_07_10.md, "07.5" — "primero construir la
 * arquitectura web comercial. Posteriormente se podrán crear
 * propuestas PDF específicas"). No price/scope was invented for any of
 * these — they're segments the commercial conversation starts from,
 * not fixed packages with a fixed price yet.
 */
const packages = [
  { name: "Corporativo", detail: "Activaciones y shows para empresas — eventos internos, lanzamientos, convenciones." },
  { name: "Productoras / festivales", detail: "Shows dentro de una producción o cartel más grande." },
  { name: "Colegios", detail: "Formato adaptado a audiencia escolar, con enfoque en disciplina y esfuerzo." },
  { name: "Eventos privados", detail: "Quince años, celebraciones y experiencias a medida." },
  { name: "Rooftops / venues", detail: "Formato reducido, ideal para espacios íntimos." },
];

export default function ShowsPage() {
  return (
    <>
      <PageHero
        tag="SHOWS"
        title="Shows"
        description="Un show construido sobre disciplina física real, adaptado al formato de tu evento o institución."
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <TrackedLink
            event={{ name: "cta_click", cta: "intent_shows", topic: "shows" }}
            href="/contacto?topic=shows"
            className="inline-flex w-fit items-center border border-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
          >
            Quiero contratar un show
          </TrackedLink>
          <GoLink
            slug={goLinks.whatsappCommercial}
            className="inline-flex w-fit items-center border border-chalk px-6 py-3 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
          >
            Quiero hablar con Cristian
          </GoLink>
        </div>
      </PageHero>
      <section className="py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Para quién</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {audiences.map((audience) => (
              <span
                key={audience}
                className="border border-steel-dim/50 px-4 py-2 text-sm text-steel"
              >
                {audience}
              </span>
            ))}
          </div>
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Formatos de partida</p>
          <div className="mt-6 grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.name} className="bg-ink p-6">
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-chalk">
                  {pkg.name}
                </h3>
                <p className="mt-2 text-sm text-steel">{pkg.detail}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
