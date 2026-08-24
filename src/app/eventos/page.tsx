import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Eventos",
  description: "Próximas apariciones y eventos de Cristian Barbosa.",
  path: "/eventos",
});

/**
 * No real event is published yet — nothing here is invented (docs/
 * MASTER_BRIEF_BLOCK_08.md, "08.8": "separar eventos propios / eventos
 * donde Cristian participó / eventos futuros / presentaciones", "NO
 * inventar eventos"). Four honest empty categories, not one generic
 * "vuelve pronto" — the structure the brief asks for, none of the
 * content it explicitly forbids inventing. No new `event` table either
 * (docs/DATABASE.md, "Extending the schema": demonstrate why the
 * existing ones don't serve first) — building schema for zero real
 * rows is exactly the speculative-infrastructure pattern the brief's
 * own "no construyas más software del necesario" warns against; the
 * moment a real event exists, its shape (fecha/lugar/imagen/tipo/
 * estado) becomes a real, informed migration decision instead of a
 * guess.
 */
const categories = [
  { title: "Eventos propios", detail: "Presentaciones organizadas directamente por Cristian Barbosa." },
  { title: "Participaciones", detail: "Eventos de terceros donde Cristian se presenta." },
  { title: "Próximos", detail: "Fechas confirmadas, todavía sin publicar." },
  { title: "Presentaciones pasadas", detail: "Historial de apariciones anteriores." },
];

export default function EventosPage() {
  return (
    <>
      <PageHero
        tag="EVENTS"
        title="Eventos"
        description="La agenda de próximas apariciones se publicará aquí."
      />
      <section className="py-16">
        <Container className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
          {categories.map((category) => (
            <div key={category.title} className="bg-ink p-6">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-chalk">
                {category.title}
              </h2>
              <p className="mt-2 text-sm text-steel">{category.detail}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-steel-dim">Todavía sin publicar</p>
            </div>
          ))}
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Mientras tanto</p>
          <p className="mt-4 max-w-xl text-sm text-steel">
            ¿Quieres una experiencia similar en tu empresa, colegio o evento?
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <TrackedLink
              event={{ name: "cta_click", cta: "intent_shows", topic: "eventos" }}
              href="/shows"
              className="inline-flex w-fit items-center border border-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
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
