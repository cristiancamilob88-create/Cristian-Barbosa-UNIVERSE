import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { agendaHref, navItems, pressCoverage } from "@/config/site";
import { colombiaToday } from "@/config/upcomingShows";
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

// The summary's song line changes by itself on release day.
export const revalidate = 86400;

const DIAMANTE_RELEASE = "2026-10-15";

const buttonPrimary =
  "inline-flex w-fit items-center bg-ember px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-chalk";
const buttonSecondary =
  "inline-flex w-fit items-center bg-chalk px-5 py-3 text-base font-bold text-ink transition-colors hover:bg-ember";

export default function AboutPage() {
  const released = colombiaToday() >= DIAMANTE_RELEASE;
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
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,13,12,0.95)_0%,rgba(11,13,12,0.4)_50%,rgba(11,13,12,0)_80%)]" /* taste-skill-ignore: neutral scrim under text on a photo */ />
      </section>
      <PageHero
        tag="HISTORIA"
        title="Historia"
        description={`De ${bioFacts.grewUpIn} a ${bioFacts.basedIn}: más de una década entrenando.`}
      >
        {/* Cristian en 3 líneas + where to go next, right at the top
            (2026-10-08: visitors read this page and left without a next
            step — every button used to sit 10 screens down). */}
        <ul className="mt-6 flex max-w-2xl flex-col gap-2 border-l-2 border-ember pl-4 text-base text-chalk sm:text-lg">
          <li>
            {bioFacts.age} años · <strong>4 veces campeón nacional de calistenia</strong>
          </li>
          <li>
            Más de 20 pueblos en presentaciones con el {bioFacts.circusName}
          </li>
          <li>
            {released ? (
              <>Su primera canción, <strong>&quot;El Diamante&quot;</strong>, ya está disponible</>
            ) : (
              <>El 15 de octubre de 2026 lanza su primera canción, <strong>&quot;El Diamante&quot;</strong></>
            )}
          </li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <TrackedLink event={{ name: "cta_click", cta: "intent_shows", topic: "about_hero" }} href="/shows" className={buttonPrimary}>
            Contratar un show
          </TrackedLink>
          <TrackedLink event={{ name: "cta_click", cta: "intent_music", topic: "about_hero" }} href="/musica" className={buttonSecondary}>
            Escuchar El Diamante
          </TrackedLink>
          <TrackedLink event={{ name: "cta_click", cta: "intent_training", topic: "about_hero" }} href="/entrenar#sesion" className={buttonSecondary}>
            Entrenar conmigo
          </TrackedLink>
        </div>
      </PageHero>
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
            De los 12 a los 18 años vivió en Fusagasugá, en varias casas: con la familia de su amigo Sebastián
            Montaño, que también hace calistenia, y con su tía Miriam Pachón, en cuya casa pasó toda la
            pandemia, de 2020 a 2021.
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

      <section className="py-16">
        <Container>
          <p className="text-base text-tide">Logros</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="bg-ink-raised p-6">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-ember">4 veces campeón nacional</h2>
              <ul className="mt-3 flex flex-col gap-2 text-base text-steel">
                {achievements.titles.map((item) => (
                  <li key={item.label}>{item.label.replace("Campeón nacional de calistenia — ", "")}</li>
                ))}
              </ul>
            </div>
            <div className="bg-ink-raised p-6">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-chalk">Subcampeón nacional</h2>
              <ul className="mt-3 flex flex-col gap-2 text-base text-steel">
                {achievements.runnerUp.map((item) => (
                  <li key={item.label}>{item.label.replace("Subcampeón nacional — ", "")}</li>
                ))}
              </ul>
            </div>
            <div className="bg-ink-raised p-6">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-chalk">Embajador y artista</h2>
              <ul className="mt-3 flex flex-col gap-2 text-base text-steel">
                {achievements.roles.map((item) => (
                  <li key={item.label}>{item.label}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="text-base text-steel">Entrena con un campeón nacional:</p>
            <TrackedLink event={{ name: "cta_click", cta: "intent_training", topic: "about_logros" }} href="/entrenar#sesion" className={buttonSecondary}>
              Sesión 1:1 · $80.000
            </TrackedLink>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <p className="text-base text-tide">El camino</p>
          <ol className="mt-8 flex max-w-3xl flex-col">
            {timeline.map((entry) => (
              <li key={entry.title} className="relative pb-10 pl-8 last:pb-0">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-ember" aria-hidden="true" />
                <p className="text-base text-steel-dim">{entry.when}</p>
                <h3 className="mt-1 font-display text-xl font-black uppercase tracking-tight text-chalk">{entry.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-steel">{entry.detail}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <TrackedLink event={{ name: "cta_click", cta: "intent_events", topic: "about_camino" }} href={agendaHref} className={buttonSecondary}>
              Ver el mapa de la gira
            </TrackedLink>
            <TrackedLink event={{ name: "cta_click", cta: "intent_shows", topic: "about_camino" }} href="/shows" className={buttonPrimary}>
              Contratar un show
            </TrackedLink>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container className="grid gap-3 md:grid-cols-3">
          <div className="bg-ink-raised p-6">
            <h2 className="text-base text-ember">Misión</h2>
            <p className="mt-3 text-base leading-relaxed text-steel">{purpose.mission}</p>
          </div>
          <div className="bg-ink-raised p-6">
            <h2 className="text-base text-ember">Visión</h2>
            <p className="mt-3 text-base leading-relaxed text-steel">{purpose.vision}</p>
          </div>
          <div className="bg-ink-raised p-6">
            <h2 className="text-base text-ember">Valores</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {purpose.values.map((value) => (
                <li key={value} className="px-3 py-1 text-base text-chalk bg-ink-raised">
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <p className="text-base text-tide">Prensa y entrevistas</p>
          <div className="mt-6 flex flex-wrap gap-8">
            {pressCoverage.map((item) => (
              <div key={item.label} className="flex w-full max-w-xs flex-col gap-3">
                {item.url && item.image && (
                  <TrackedLink
                    href={item.url}
                    external
                    event={{ name: "cta_click", cta: "press_link_image", topic: "about" }}
                    className="block overflow-hidden bg-ink-raised"
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
                <p className="text-base text-steel-dim">
                  {item.outlet} · {item.year}
                </p>
                {item.url ? (
                  <TrackedLink
                    href={item.url}
                    external
                    event={{ name: "cta_click", cta: "press_link_text", topic: "about" }}
                    className="text-base text-chalk underline decoration-tide underline-offset-4 hover:text-tide"
                  >
                    {item.label} →
                  </TrackedLink>
                ) : (
                  <p className="text-base text-chalk">{item.label}</p>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <p className="text-base text-tide">Su historia, por capítulos</p>
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
      <section className="py-16">
        <Container>
          <p className="text-base text-steel-dim">Sigue explorando</p>
          <div className="mt-6 flex flex-wrap gap-4">
            {bridgeItems.map((item) => (
              <TrackedLink
                key={item.href}
                href={item.href}
                event={{ name: "cta_click", cta: item.intentId, topic: "about" }}
                className="px-5 py-2.5 text-base font-bold text-ink transition-colors bg-chalk hover:bg-ember focus-visible:bg-ember"
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
