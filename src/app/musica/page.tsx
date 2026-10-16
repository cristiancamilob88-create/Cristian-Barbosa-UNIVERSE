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
        tag="MÚSICA"
        image={{ src: "/brand/cristian-brand-art-01.png", alt: "Arte de Cristian Barbosa en escenario", position: "object-[50%_20%]" }}
        title="Música"
        description="La historia detrás de cada canción, el backstage, y el acceso anticipado antes de que llegue a las plataformas."
      >
        <TrackedLink
          event={{ name: "cta_click", cta: "intent_music_early_access", topic: "musica" }}
          href="/contacto?topic=musica"
          className="mt-8 inline-flex w-fit items-center px-6 py-3 text-base font-bold text-ink transition-colors bg-ember hover:bg-chalk focus-visible:bg-chalk"
        >
          Quiero escucharla antes que nadie
        </TrackedLink>
      </PageHero>
      {/* First real release (Cristian, 2026-10-03). */}
      <section className="pt-16">
        <Container>
          <div className="flex flex-col gap-4 bg-ink-raised p-8">
            <h2 className="font-display text-4xl font-black uppercase tracking-tight text-chalk sm:text-5xl">El Diamante</h2>
            <p className="max-w-2xl text-lg leading-relaxed text-chalk">
              Salió el 15 de octubre de 2026. Su primer rap con equipo profesional: una idea escrita a mano que se volvió canción, grabada en un
              estudio en la vereda La Miel de Caldas, Antioquia, con el productor Cristian Alvia.
            </p>
            <Link href="/blog/el-diamante-cancion" className="w-fit text-base text-chalk underline decoration-tide underline-offset-4 hover:text-tide">
              La historia detrás de la canción →
            </Link>
          </div>
        </Container>
      </section>
      <section className="py-16">
        {/* The three "Lanzamiento / Backstage / Early access" boxes that
            stood here were promises with nothing behind them yet —
            removed 2026-10-07 (site review). Bring a section back once
            there is real backstage content to show. */}
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
        <Container className="bg-ink-raised p-8">
          <p className="text-base text-ember">Próximamente</p>
          <p className="mt-3 max-w-2xl text-base text-steel">
            Cada canción se venderá individualmente por{" "}
            <span className="text-chalk">{formatCents(1_000_000)}</span>. El
            acceso privado a las canciones compradas queda ligado a una compra confirmada —
            por ahora, deja tu contacto arriba para ser de los primeros en enterarte cuando
            el catálogo se active.
          </p>
        </Container>
        <Container className="mt-10">
          <TrackedLink
            event={{ name: "cta_click", cta: "intent_social", topic: "musica" }}
            href="/redes"
            className="inline-flex w-fit items-center px-5 py-2.5 text-base font-bold text-ink transition-colors bg-chalk hover:bg-ember focus-visible:bg-ember"
          >
            Quiero seguir a Cristian
          </TrackedLink>
        </Container>
      </section>
    </>
  );
}
