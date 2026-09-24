import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Eventos y agenda",
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
];

interface PastPresentation {
  place: string;
  date: string;
  description: string;
}

/**
 * Real entries only, added the same day something actually happened —
 * never scheduled or written ahead of time (same "NO inventar eventos"
 * rule as `categories` above). Cristian's own ask, 2026-08-25: document
 * real appearances ("ya estuvimos en el colegio de la Leticia, en tal
 * municipio, haciendo tal") — he explicitly chose reusing this existing
 * "Presentaciones pasadas" category over a new "Noticias" section, so
 * this is that category's real content, not a new content type. Starts
 * empty on purpose: the Colegio de la Leticia — Envigado visit
 * (2026-08-27, docs/RUNNING_CHECKLIST.md) hasn't happened yet as of
 * this commit — its entry lands here the day it actually does, with
 * whatever really happened, not a placeholder written in advance.
 * A plain array, not a table (same reasoning as the comment above) —
 * revisit once there are enough real entries that editing this file by
 * hand stops being the fastest way to add one.
 */
const pastPresentations: PastPresentation[] = [];

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
          <div className="bg-ink p-6">
            <h2 className="font-display text-lg font-black uppercase tracking-tight text-chalk">
              Presentaciones pasadas
            </h2>
            <p className="mt-2 text-sm text-steel">Historial de apariciones anteriores.</p>
            {pastPresentations.length === 0 ? (
              <p className="mt-3 text-xs uppercase tracking-widest text-steel-dim">Todavía sin publicar</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {pastPresentations.map((entry) => (
                  <li key={`${entry.place}-${entry.date}`} className="border-t border-steel-dim/40 pt-4 first:border-t-0 first:pt-0">
                    <p className="font-mono text-xs uppercase tracking-widest text-tide">{entry.date}</p>
                    <p className="mt-1 font-display text-base font-black uppercase tracking-tight text-chalk">{entry.place}</p>
                    <p className="mt-1 text-sm text-steel">{entry.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
