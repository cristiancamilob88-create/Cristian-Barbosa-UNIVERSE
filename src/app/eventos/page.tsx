import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Eventos",
  description: "Próximas apariciones y eventos de Cristian Barbosa.",
  path: "/eventos",
});

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
    </>
  );
}
