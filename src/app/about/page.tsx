import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";
import { navItems } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Historia de Cristian Barbosa — artista, shows y calistenia",
  absoluteTitle: true,
  description:
    "Quién es Cristian Barbosa: de entrenar calistenia en una barra a construir una comunidad, llevar la disciplina a un escenario y hacer música.",
  path: "/about",
});

/**
 * Historia is a Brand Story / Authority Layer, not an isolated bio
 * (docs/MASTER_BRIEF_BLOCK_07_10.md, "07.7"). Every section below is a
 * real theme the brief names — the copy inside each stays an honest
 * placeholder ("contenido pendiente de redacción") wherever the actual
 * biographical detail hasn't been provided, per the same instruction's
 * own "no inventar datos biográficos que no estén documentados." The
 * structure is real; the specifics aren't invented.
 */
const storyThemes = [
  { title: "Historia", detail: "De la calistenia en una barra al universo que existe hoy." },
  { title: "Evolución", detail: "Cómo pasó de entrenar solo a construir una comunidad." },
  { title: "Calistenia", detail: "La disciplina física que sostiene todo lo demás." },
  { title: "Trayectoria", detail: "El camino recorrido — entrenamiento, competencias, escenario." },
  { title: "Competencias", detail: "Resultados y momentos que marcaron el camino." },
  { title: "Música", detail: "El lado artístico — de dónde viene y hacia dónde va." },
  { title: "Shows", detail: "Llevar la disciplina física a un escenario real." },
  { title: "Comunidad", detail: "Por qué construir una comunidad, no solo una audiencia." },
  { title: "Visión", detail: "Hacia dónde va el universo de Cristian Barbosa." },
  { title: "Proyectos", detail: "Lo que viene — entrenamiento, música, marca." },
];

/**
 * Historia should connect toward every pillar, not just a curated
 * four (docs/MASTER_BRIEF_BLOCK_07_10.md, "07.7": "enlaces internos
 * hacia /entrenar /comunidad /musica /productos /shows /marcas
 * /eventos /redes"). Pulled straight from `navItems` — never a second,
 * hardcoded list (AGENTS.md).
 */
const bridgeSlugs = ["/entrenar", "/comunidad", "/musica", "/productos", "/shows", "/marcas", "/eventos", "/redes"];
const bridgeItems = navItems.filter((item) => bridgeSlugs.includes(item.href));

export default function AboutPage() {
  return (
    <>
      {/* Real photo (Cristian's own send, 2026-08-28 — solo shot, no
          consent question, unlike the fan photos that went to /shows).
          Same full-bleed hero technique as /bienvenida/[slug]. */}
      <section className="relative h-[42vh] min-h-[300px] w-full overflow-hidden bg-ink lg:h-[60vh]">
        <Image
          src="/brand/cristian-mountain-flex.jpg"
          alt="Cristian Barbosa"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_48%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
      </section>
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
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">El universo, por capítulos</p>
          <div className="mt-6 grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2 lg:grid-cols-3">
            {storyThemes.map((theme) => (
              <div key={theme.title} className="bg-ink p-6">
                <h2 className="font-display text-lg font-black uppercase tracking-tight text-chalk">
                  {theme.title}
                </h2>
                <p className="mt-2 text-sm text-steel">{theme.detail}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Prensa</p>
          <p className="mt-4 max-w-2xl text-sm text-steel">
            Cristian ha sido entrevistado en medios como El Colombiano. Press kit y enlaces a
            entrevistas/apariciones, próximamente.
          </p>
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Sigue explorando</p>
          <div className="mt-6 flex flex-wrap gap-4">
            {bridgeItems.map((item) => (
              <TrackedLink
                key={item.href}
                href={item.href}
                event={{ name: "cta_click", cta: item.intentId, topic: "about" }}
                className="border border-steel-dim/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:border-ember hover:text-ember"
              >
                {item.intent}
              </TrackedLink>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
