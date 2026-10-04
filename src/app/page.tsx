import type { Metadata } from "next";
import Image from "next/image";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { InstagramEmbed } from "@/components/ui/InstagramEmbed";
import { ParticleBody } from "@/components/ui/ParticleBody";
import Link from "next/link";
import { goLinks, navItems, siteConfig } from "@/config/site";
import { GoLink } from "@/components/ui/GoLink";
import { blogIndexPath, blogPostPath, blogPosts } from "@/content/blog";
import { pastShowsIndexPath } from "@/config/pastShows";
import { circusCountLabel } from "@/config/tourStops";
import { buildMetadata } from "@/lib/seo";
import { personJsonLd, toSameAs } from "@/lib/structuredData";
import { getPool } from "@/server/db/pool";
import { listActiveSocialProfiles } from "@/server/db/repositories/socialProfile";

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — Música, shows y calistenia`,
  absoluteTitle: true,
  description: siteConfig.description,
  path: "/",
});

// Artistic identity first (Cristian, 2026-09-24): he wants to be known
// for his music, shows and content — training stays an offer
// (/entrenar, "Quiero entrenar"), not a label on who he is.
const tickerWords = [
  "ARTISTA",
  "MÚSICO",
  "PERFORMER",
  "ATLETA",
  "CREADOR",
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
// Regenerated at most hourly (ISR), not per request: the only DB read
// here is the social-profile list for Google's `sameAs` below, which
// changes rarely — the page itself stays a cached static page. Same
// direct server-component read /redes already does (its own comment
// explains the exception to the Route Handler rule).
export const revalidate = 3600;

/**
 * Cristian's public profiles, for the Person structured data's `sameAs`
 * (src/lib/structuredData.ts). Never allowed to break the homepage: a
 * missing/unreachable database (a build without DATABASE_URL, an outage)
 * just means no `sameAs` this round — the layout's base Person block
 * still ships.
 */
async function loadSameAs(): Promise<string[]> {
  try {
    return toSameAs(await listActiveSocialProfiles(getPool()));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const sameAs = await loadSameAs();

  return (
    <>
      {sameAs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(sameAs)) }}
        />
      )}
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
            {/* Clear first clicks (Cristian, 2026-10-04: "que la gente
                sepa dónde clickear") — the two things that make money
                plus the story, right in the first screen. */}
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedLink
                event={{ name: "cta_click", cta: "intent_shows", topic: "home_hero" }}
                href="/contacto?topic=shows"
                className="inline-flex items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk"
              >
                Contratar un show
              </TrackedLink>
              <TrackedLink
                event={{ name: "cta_click", cta: "intent_training", topic: "home_hero" }}
                href="/entrenar#sesion"
                className="inline-flex items-center border border-chalk px-6 py-3 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
              >
                Entrenar conmigo · $80.000
              </TrackedLink>
              <TrackedLink
                event={{ name: "cta_click", cta: "intent_story", topic: "home_hero" }}
                href="/about"
                className="inline-flex items-center px-2 py-3 text-sm font-semibold uppercase tracking-wide text-steel underline underline-offset-4 transition-colors hover:text-chalk"
              >
                Conoce su historia
              </TrackedLink>
            </div>
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

      {/* The menu of the whole universe, moved up right under the hero
          (2026-10-04) — it used to sit at the very bottom, after the
          long particle section and the video, so on a phone almost
          nobody reached it. Two compact columns on mobile. */}
      <section className="border-b border-steel-dim/40 py-12">
        <Container>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-chalk sm:text-3xl">
            ¿Qué quieres hacer?
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-none border border-steel-dim/40 bg-steel-dim/40 lg:grid-cols-3">
            {navItems.map((item, i) => (
              <Reveal key={item.href} delay={(i % 3) * 0.08} className="bg-ink">
                <TrackedLink
                  href={item.href}
                  event={{ name: "cta_click", cta: item.intentId, topic: item.tag.toLowerCase() }}
                  className="group flex h-full flex-col justify-between gap-4 p-4 transition-colors hover:bg-ink-raised sm:gap-8 sm:p-8"
                >
                  <span className="font-mono text-xs uppercase tracking-widest text-ember">
                    {item.tag}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-black uppercase leading-tight tracking-tight text-chalk group-hover:text-ember sm:text-2xl">
                      {item.intent} →
                    </h3>
                    <p className="mt-2 hidden text-sm text-steel sm:block">{item.description}</p>
                  </div>
                </TrackedLink>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Signature 3D-feel piece (2026-09-25, Etapa A): his body breaks
          into a cloud of light as you scroll, reassembles on the way
          back. See ParticleBody's own comment. */}
      <ParticleBody>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-tide">Cristian Barbosa</p>
        <p className="mt-4 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-chalk sm:text-7xl">
          Artista.
          <br />
          Performer.
          <br />
          <span className="text-ember">Atleta.</span>
        </p>
      </ParticleBody>

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

      {/* Proof: where he has performed (2026-10-04). */}
      <section className="border-b border-steel-dim/40 py-16">
        <Container className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">Shows realizados</p>
            <h2 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-chalk sm:text-5xl">
              {circusCountLabel()} municipios
            </h2>
            <p className="mt-3 max-w-xl text-steel">
              De gira con el Circo Santiago de Chile por Antioquia y Chocó, además de colegios y alcaldías
              en Medellín, Envigado, San Rafael, Bogotá y Fusagasugá.
            </p>
          </div>
          <TrackedLink
            event={{ name: "cta_click", cta: "intent_shows", topic: "home_tour" }}
            href={pastShowsIndexPath}
            className="inline-flex w-fit items-center border border-tide px-6 py-3 text-sm font-semibold uppercase tracking-wide text-tide transition-colors hover:bg-tide hover:text-ink"
          >
            Ver el mapa de la gira
          </TrackedLink>
        </Container>
      </section>

      <section className="border-b border-steel-dim/40 py-16">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk">Su historia, por capítulos</h2>
            <Link href={blogIndexPath} className="shrink-0 text-sm text-steel underline underline-offset-4 hover:text-chalk">
              Ver blog →
            </Link>
          </div>
          <ul className="mt-6 grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 md:grid-cols-3">
            {blogPosts.map((post) => (
              <li key={post.slug} className="bg-ink">
                <Link href={blogPostPath(post.slug)} className="group flex h-full flex-col gap-2 p-6 hover:bg-ink-raised">
                  <span className="font-mono text-xs uppercase tracking-widest text-ember">{post.category}</span>
                  <span className="font-display text-lg font-black uppercase leading-tight tracking-tight text-chalk group-hover:text-ember">
                    {post.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16">
        <Container className="flex flex-col items-start gap-6 border border-ember/60 bg-ink-raised p-8 sm:p-12">
          <h2 className="max-w-2xl font-display text-3xl font-black uppercase leading-tight tracking-tight text-chalk sm:text-5xl">
            ¿Quieres a Cristian en tu evento?
          </h2>
          <p className="max-w-xl text-steel">
            Municipios, colegios, empresas, ferias y eventos privados en Medellín y toda Antioquia.
          </p>
          <div className="flex flex-wrap gap-3">
            <TrackedLink
              event={{ name: "cta_click", cta: "intent_shows", topic: "home_final" }}
              href="/contacto?topic=shows"
              className="inline-flex items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk"
            >
              Cotizar un show
            </TrackedLink>
            <GoLink
              slug={goLinks.whatsappCommercial}
              className="inline-flex items-center border border-chalk px-6 py-3 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
            >
              Escribir por WhatsApp
            </GoLink>
          </div>
        </Container>
      </section>
    </>
  );
}
