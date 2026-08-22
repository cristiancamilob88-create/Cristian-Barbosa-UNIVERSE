import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { navItems, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: siteConfig.universeName,
  description: siteConfig.description,
  path: "/",
});

const tickerWords = [
  "CALISTENIA",
  "COACHING",
  "COMUNIDAD",
  "MÚSICA",
  "SHOWS",
  "MARCAS",
  "EVENTOS",
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-steel-dim/40 pb-14 pt-20 sm:pt-28">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">
            {siteConfig.universeName}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-chalk sm:text-7xl">
            Un atleta.
            <br />
            Un artista.
            <br />
            <span className="text-ember">Un universo entero.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-steel">
            Cristian Barbosa no es solo entrenamiento. Es calistenia, coaching, comunidad,
            música, shows en vivo y proyectos de marca — todo conectado en un solo lugar.
          </p>
        </Container>
      </section>

      {/* Signature element: a scoreboard/lower-third ticker of the universe's pillars. */}
      <div
        aria-hidden="true"
        className="overflow-hidden border-b border-steel-dim/40 bg-ink-raised py-3"
      >
        <div className="ticker-track flex w-max gap-8 whitespace-nowrap">
          {[...tickerWords, ...tickerWords].map((word, i) => (
            <span key={i} className="font-mono text-sm uppercase tracking-widest text-steel-dim">
              {word} <span className="text-ember">·</span>
            </span>
          ))}
        </div>
      </div>

      <section className="py-16">
        <Container>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">
            Explora el universo
          </h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-none border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2 lg:grid-cols-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col justify-between gap-8 bg-ink p-8 transition-colors hover:bg-ink-raised"
              >
                <span className="font-mono text-xs uppercase tracking-widest text-ember">
                  {item.tag}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-black uppercase tracking-tight text-chalk group-hover:text-ember">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-sm text-steel">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
