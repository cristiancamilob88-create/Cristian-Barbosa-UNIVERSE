import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Historia",
  description: "Quién es Cristian Barbosa — la historia detrás del universo.",
  path: "/about",
});

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
    </>
  );
}
