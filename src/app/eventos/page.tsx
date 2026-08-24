import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Eventos",
  description: "Próximas apariciones y eventos de Cristian Barbosa.",
  path: "/eventos",
});

/**
 * No real event is published yet — nothing here is invented (docs/
 * MASTER_BRIEF_BLOCK_07_10.md, "07.9": "no convertir eventos en una
 * página puramente editorial"). Until a real event exists, this page's
 * commercial job is the bridge itself: "quieres algo similar? contrata
 * un show" — the one purpose the brief names that doesn't require
 * fabricating a date/venue/lineup.
 */
export default function EventosPage() {
  return (
    <>
      <PageHero
        tag="EVENTS"
        title="Eventos"
        description="La agenda de próximas apariciones se publicará aquí."
      />
      <section className="py-16">
        <Container>
          <p className="text-sm text-steel">Todavía no hay eventos publicados — vuelve pronto.</p>
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Mientras tanto</p>
          <p className="mt-4 max-w-xl text-sm text-steel">
            ¿Quieres una experiencia similar en tu empresa, colegio o evento?
          </p>
          <TrackedLink
            event={{ name: "cta_click", cta: "intent_shows", topic: "eventos" }}
            href="/shows"
            className="mt-6 inline-flex w-fit items-center border border-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
          >
            Quiero contratar un show
          </TrackedLink>
        </Container>
      </section>
    </>
  );
}
