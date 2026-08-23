import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
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
      >
        <TrackedLink
          event={{ name: "cta_click", cta: "intent_music_early_access", topic: "musica" }}
          href="/contacto?topic=musica"
          className="mt-8 inline-flex w-fit items-center border border-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
        >
          Quiero escucharla antes que nadie
        </TrackedLink>
      </PageHero>
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
        <Container className="mt-10">
          <TrackedLink
            event={{ name: "cta_click", cta: "intent_social", topic: "musica" }}
            href="/redes"
            className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
          >
            Quiero seguir a Cristian
          </TrackedLink>
        </Container>
      </section>
    </>
  );
}
