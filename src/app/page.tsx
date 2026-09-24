import type { Metadata } from "next";
import Image from "next/image";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { InstagramEmbed } from "@/components/ui/InstagramEmbed";
import { navItems, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — Calistenia, shows y comunidad`,
  absoluteTitle: true,
  description: siteConfig.description,
  path: "/",
});

const tickerWords = [
  "ATLETA",
  "ARTISTA",
  "ENTRENADOR",
  "MÚSICO",
  "PERFORMER",
  "COMUNIDAD",
  "EMPRESARIO",
];

/**
 * The home is a HUB, not a Linktree and not a wall of everything at
 * once (Block 04.2, docs/UNIVERSE_UX.md, "Arquitectura de intenciones").
 * Every card below is one of `navItems`' own `intent` phrases — the
 * exact first-person verb a visitor clicks, not a repeated category
 * label — so a new route added to site.ts shows up here framed as an
 * intention automatically, never a second copy to maintain.
 */
export default function HomePage() {
  return (
    <>
      {/* Logo watermarked into the hero background — same technique
          Cristian approved on /bienvenida/[slug] ("como si perdiera
          transparencia"), reused here on the homepage hero per his
          2026-08-28 request to start filling the empty/text-only
          sections with the real logo. Text/layout underneath untouched. */}
      <section className="relative overflow-hidden border-b border-steel-dim/40 pb-14 pt-20 sm:pt-28">
        <Image
          src="/brand/cristian-logo-01.png"
          alt=""
          aria-hidden="true"
          fill
          className="pointer-events-none select-none object-cover opacity-[0.08]"
        />
        <Container className="relative">
          {/* First motion piece (2026-08-28, Cristian's "quiero algo
              así, brutal") — GSAP ScrollTrigger, tried here first
              before rolling out sitewide. Fires immediately on load
              since the hero is already in view — the intended effect,
              a real page-open moment, not a scroll-triggered one here. */}
          <Reveal>
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
              Cristian Barbosa entrena, compite, crea música, sube al escenario y construye
              marca — calistenia, coaching, comunidad, shows y proyectos, todo conectado.
              Elige por dónde quieres entrar.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Signature element: a scoreboard/lower-third ticker of Cristian's own dimensions. */}
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

      {/* Real video, Cristian's own reel with Westcol (2026-08-28) —
          confirmed with him it's a real, consented collab before
          shipping. Instagram embed, same reusable component
          /bienvenida/[slug] already uses — no new dependency, no video
          file in the repo (see that page's own comment for why not). */}
      <section className="border-b border-steel-dim/40 py-16">
        <Container className="flex flex-col items-center gap-6 text-center">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">Mira de qué se trata</p>
          </Reveal>
          <Reveal delay={0.1}>
            <InstagramEmbed
              url="https://www.instagram.com/reel/DU6rtrckrID/"
              title="Cristian Barbosa con Westcol"
            />
          </Reveal>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">
            ¿Qué quieres hacer?
          </h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-none border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2 lg:grid-cols-3">
            {navItems.map((item, i) => (
              <Reveal key={item.href} delay={(i % 3) * 0.08} className="bg-ink">
                <TrackedLink
                  href={item.href}
                  event={{ name: "cta_click", cta: item.intentId, topic: item.tag.toLowerCase() }}
                  className="group flex h-full flex-col justify-between gap-8 p-8 transition-colors hover:bg-ink-raised"
                >
                  <span className="font-mono text-xs uppercase tracking-widest text-ember">
                    {item.tag}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-black uppercase tracking-tight text-chalk group-hover:text-ember">
                      {item.intent}
                    </h3>
                    <p className="mt-2 text-sm text-steel">{item.description}</p>
                  </div>
                </TrackedLink>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
