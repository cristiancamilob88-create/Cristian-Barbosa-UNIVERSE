import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { agendaHref, navItems, pressCoverage } from "@/config/site";
import { achievements, bioFacts, purpose, timeline } from "@/config/biography";
import { blogPostPath, blogPosts } from "@/content/blog";

export const metadata: Metadata = buildMetadata({
  title: "Historia de Cristian Barbosa — artista, shows y calistenia",
  absoluteTitle: true,
  description:
    "Cristian Barbosa, 22 años, de Fusagasugá a Envigado: cuatro veces campeón nacional de calistenia, artista del Circo Santiago de Chile y músico. Su historia.",
  path: "/about",
});

/**
 * Historia should connect toward every pillar, not just a curated
 * four (docs/MASTER_BRIEF_BLOCK_07_10.md, "07.7": "enlaces internos
 * hacia /entrenar /comunidad /musica /productos /shows /marcas
 * /eventos /redes"). Pulled straight from `navItems` — never a second,
 * hardcoded list (AGENTS.md).
 */
const bridgeSlugs = ["/entrenar", "/comunidad", "/musica", "/productos", "/shows", "/marcas", agendaHref, "/redes"];
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
        description={`De ${bioFacts.grewUpIn} a ${bioFacts.basedIn}: ${bioFacts.age} años, más de una década entrenando, cuatro veces campeón nacional de calistenia.`}
      />
      {/* Real story, from Cristian's own account (2026-10-03) — see
          src/config/biography.ts for sources and what's deliberately
          left out. */}
      <section className="py-16">
        <Container className="flex max-w-3xl flex-col gap-5 text-lg leading-relaxed text-steel">
          <p>
            Cristian Barbosa creció entre Bogotá y Fusagasugá. Era un niño muy delgado al que molestaban
            por su físico, hasta que a los {bioFacts.startedCalisthenicsAge} años vio el cambio de su primo
            Michael y decidió entrenar con él. El primer día terminó agotado y enamorado: había encontrado
            algo que le exigía todo.
          </p>
          <p>
            Desde entonces no ha parado. Compitió por todo el país hasta ser{" "}
            <strong className="text-chalk">cuatro veces campeón nacional de calistenia</strong>, empezó a hacer
            shows en colegios y alcaldías, y en {bioFacts.arrivedMedellin} llegó a Medellín invitado por la
            Alcaldía a presentarse frente a más de 80.000 personas. Se quedó, sin dinero y sin contactos, y
            empezó desde cero.
          </p>
          <p>
            Hoy vive en Envigado. Desde {bioFacts.joinedCircus} es artista del {bioFacts.circusName}, con el
            que se ha presentado en {bioFacts.municipalitiesCount} municipios de Antioquia y Chocó. Crea
            contenido, entrena a otros y el 15 de octubre de 2026 lanza su canción &quot;El Diamante&quot;. Su
            meta: unir calistenia, música y espectáculo en los escenarios más grandes.
          </p>
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">Logros</p>
          <div className="mt-6 grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 md:grid-cols-3">
            <div className="bg-ink p-6">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-ember">4 veces campeón nacional</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-steel">
                {achievements.titles.map((item) => (
                  <li key={item.label}>{item.label.replace("Campeón nacional de calistenia — ", "")}</li>
                ))}
              </ul>
            </div>
            <div className="bg-ink p-6">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-chalk">Subcampeón nacional</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-steel">
                {achievements.runnerUp.map((item) => (
                  <li key={item.label}>{item.label.replace("Subcampeón nacional — ", "")}</li>
                ))}
              </ul>
            </div>
            <div className="bg-ink p-6">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-chalk">Embajador y artista</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-steel">
                {achievements.roles.map((item) => (
                  <li key={item.label}>{item.label}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">El camino</p>
          <ol className="mt-8 flex max-w-3xl flex-col">
            {timeline.map((entry) => (
              <li key={entry.title} className="relative border-l border-steel-dim/50 pb-10 pl-8 last:pb-0">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-ember" aria-hidden="true" />
                <p className="font-mono text-xs uppercase tracking-widest text-steel-dim">{entry.when}</p>
                <h3 className="mt-1 font-display text-xl font-black uppercase tracking-tight text-chalk">{entry.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">{entry.detail}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-16">
        <Container className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 md:grid-cols-3">
          <div className="bg-ink p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Misión</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel">{purpose.mission}</p>
          </div>
          <div className="bg-ink p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Visión</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel">{purpose.vision}</p>
          </div>
          <div className="bg-ink p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Valores</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {purpose.values.map((value) => (
                <li key={value} className="border border-steel-dim/50 px-3 py-1 text-sm text-chalk">
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">Prensa y entrevistas</p>
          <div className="mt-6 flex flex-wrap gap-8">
            {pressCoverage.map((item) => (
              <div key={item.label} className="flex w-full max-w-xs flex-col gap-3">
                {item.url && item.image && (
                  <TrackedLink
                    href={item.url}
                    external
                    event={{ name: "cta_click", cta: "press_link_image", topic: "about" }}
                    className="block overflow-hidden border border-steel-dim/40"
                  >
                    <Image
                      src={item.image}
                      alt={`${item.label} — recorte de prensa`}
                      width={480}
                      height={640}
                      className="h-auto w-full object-cover"
                    />
                  </TrackedLink>
                )}
                <p className="font-mono text-xs uppercase tracking-widest text-steel-dim">
                  {item.outlet} · {item.year}
                </p>
                {item.url ? (
                  <TrackedLink
                    href={item.url}
                    external
                    event={{ name: "cta_click", cta: "press_link_text", topic: "about" }}
                    className="text-sm text-chalk underline decoration-tide underline-offset-4 hover:text-tide"
                  >
                    {item.label} →
                  </TrackedLink>
                ) : (
                  <p className="text-sm text-chalk">{item.label}</p>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">Su historia, por capítulos</p>
          <ul className="mt-6 flex flex-col gap-4">
            {blogPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={blogPostPath(post.slug)}
                  className="font-display text-xl font-black uppercase tracking-tight text-chalk hover:text-ember"
                >
                  {post.title} →
                </Link>
              </li>
            ))}
          </ul>
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
