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
    "Shows en vivo de Cristian Barbosa para empresas, colegios, universidades, festivales y eventos privados o masivos.",
  path: "/shows",
});

const audiences = ["Empresas", "Colegios", "Universidades", "Festivales", "Productoras", "Eventos privados", "Eventos masivos", "Experiencias de marca"];

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
            slug={goLinks.whatsappCommunity}
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
    </>
  );
}
