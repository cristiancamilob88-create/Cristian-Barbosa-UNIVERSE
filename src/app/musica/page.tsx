import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Música",
  description: "El lado artístico de Cristian Barbosa: lanzamientos, backstage y acceso anticipado.",
  path: "/musica",
});

export default function MusicaPage() {
  return (
    <>
      <PageHero
        tag="MUSIC"
        title="Música"
        description="La historia detrás de cada canción, el backstage, y el acceso anticipado antes de que llegue a las plataformas."
      />
      <section className="py-16">
        <Container className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-3">
          {[
            { title: "Lanzamiento", detail: "La canción y su historia." },
            { title: "Backstage", detail: "Contenido detrás de cámaras." },
            { title: "Early access", detail: "Acceso anticipado antes del lanzamiento público." },
          ].map((block) => (
            <div key={block.title} className="bg-ink p-8">
              <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">
                {block.title}
              </h2>
              <p className="mt-2 text-sm text-steel">{block.detail}</p>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
