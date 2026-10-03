import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import Link from "next/link";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Música de Cristian Barbosa — lanzamientos y canciones",
  absoluteTitle: true,
  description:
    "La música de Cristian Barbosa: lanzamientos, la historia detrás de cada canción, backstage y acceso anticipado.",
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
      {/* First real release (Cristian, 2026-10-03). */}
      <section className="pt-16">
        <Container>
          <div className="flex flex-col gap-4 border border-ember/60 bg-ink-raised p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-ember">Lanzamiento · 15 de octubre de 2026</p>
            <h2 className="font-display text-4xl font-black uppercase tracking-tight text-chalk sm:text-5xl">El Diamante</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-steel">
              Su primer rap con equipo profesional: una idea escrita a mano que se volvió canción, grabada en un
              estudio en la vereda La Miel de Caldas, Antioquia, con el productor Cristian Alvia.
            </p>
            <Link href="/blog/el-diamante-cancion" className="w-fit text-sm text-chalk underline decoration-tide underline-offset-4 hover:text-tide">
              La historia detrás de la canción →
            </Link>
          </div>
        </Container>
      </section>
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
        {/*
         * "Escuchar música" is the intention this whole page answers;
         * "comprar canción" is a separate conversion — never conflated
         * (docs/MASTER_BRIEF_BLOCK_07_10.md, "Block 08"). The price
         * model is confirmed (10.000 COP por canción); the catalog
         * identity (title, artwork, access mechanism) isn't yet, so no
         * product/offer row was created here — inventing one would mean
         * inventing the song. This section states the confirmed
         * business model without pretending a purchase flow exists.
         */}
        <Container className="mt-10 border border-steel-dim/40 bg-ink p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-ember">Próximamente</p>
          <p className="mt-3 max-w-2xl text-sm text-steel">
            Cada canción se venderá individualmente por{" "}
            <span className="font-mono text-chalk">{formatCents(1_000_000)}</span>. El
            acceso privado a las canciones compradas queda ligado a una compra confirmada —
            por ahora, deja tu contacto arriba para ser de los primeros en enterarte cuando
            el catálogo se active.
          </p>
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
