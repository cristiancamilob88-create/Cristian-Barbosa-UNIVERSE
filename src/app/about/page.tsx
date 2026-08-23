import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";
import { navItems } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Historia",
  description: "Quién es Cristian Barbosa — la historia detrás del universo.",
  path: "/about",
});

/**
 * The story doesn't sell directly — its job is connection/authority/trust
 * (Block 04.2, docs/UNIVERSE_UX.md, "Historia"). What it needs after
 * that is a bridge into the rest of the universe, so reading it isn't a
 * dead end — the same four intentions most likely to follow "now that I
 * know him, what next," pulled straight from site.ts (never a second,
 * hardcoded list).
 */
const bridgeSlugs = ["/entrenar", "/musica", "/shows", "/redes"];
const bridgeItems = navItems.filter((item) => bridgeSlugs.includes(item.href));

export default function AboutPage() {
  return (
    <>
      <PageHero
        tag="ABOUT"
        title="Historia"
        description="Cristian Barbosa no empezó como marca — empezó entrenando en una barra."
      />
      <section className="py-16">
        <Container>
          <p className="max-w-2xl text-steel">
            Esta página cuenta la historia personal de Cristian: de la calistenia a la
            comunidad, del entrenamiento a la música y los shows. Contenido pendiente de
            redacción final.
          </p>
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Sigue explorando</p>
          <div className="mt-6 flex flex-wrap gap-4">
            {bridgeItems.map((item) => (
              <TrackedLink
                key={item.href}
                href={item.href}
                event={{ name: "cta_click", cta: item.intentId, topic: "about" }}
                className="border border-steel-dim/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:border-ember hover:text-ember"
              >
                {item.intent}
              </TrackedLink>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
