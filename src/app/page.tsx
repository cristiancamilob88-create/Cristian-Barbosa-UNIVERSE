import type { Metadata } from "next";
import Image from "next/image";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { Reveal } from "@/components/ui/Reveal";
import { InstagramEmbed } from "@/components/ui/InstagramEmbed";
import { TownCheck } from "@/components/home/TownCheck";
import { ParticleBody } from "@/components/ui/ParticleBody";
import { collabVideos, goLinks, pressCoverage, siteConfig } from "@/config/site";
import { GoLink } from "@/components/ui/GoLink";
import { blogPostPath } from "@/content/blog";
import { circusMunicipalityCount } from "@/config/tourStops";
import { colombiaToday } from "@/config/upcomingShows";
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

/*
 * Homepage, redesigned 2026-10-16 with the taste-skill art direction
 * (.claude/skills/taste-skill, direction "name-as-monument", seed
 * 156113080, brand palette + type kept). The idea: in every show the
 * presenter turns the lights off and announces his name — so the page
 * opens on the name itself, set as architecture. One live thing: "¿Ya
 * estuvo en tu pueblo?" (TownCheck), answered from the real tour list.
 * House rules: no eyebrows, no monospace, no hairlines, no gradients.
 */

const DIAMANTE_RELEASE = "2026-10-15";

const photoClass = "object-cover";

/*
 * 2026-10-17 simplification (Cristian on his phone: "mucho desorden
 * visual… quiero que sea sencillo, que se entienda"): the name-band hero
 * with link tiles and colour rails became one photograph with the name
 * on it, one sentence and two buttons; then three clear doors (show,
 * training, music). Same brand, same house rules, far fewer things on
 * each screen.
 */
const doors = [
  {
    href: "/shows",
    cta: "intent_shows",
    title: "Contratar un show",
    line: "Calistenia, fuego y música para tu evento, colegio o municipio.",
    src: "/brand/show-crowd-01.jpg",
    alt: "Cristian Barbosa con el público después de un show",
    pos: "50% 30%",
  },
  {
    href: "/entrenar",
    cta: "intent_training",
    title: "Entrenar conmigo",
    line: "Sesión 1:1 de 70 minutos por $80.000, a tu nivel.",
    src: "/brand/cristian-mountain-flex.jpg",
    alt: "Cristian Barbosa entrenando en la montaña",
    pos: "50% 30%",
  },
  {
    href: "/musica",
    cta: "intent_music",
    title: "Escuchar mi música",
    line: "El Diamante, mi primera canción de rap.",
    src: "/brand/cristian-brand-art-01.png",
    alt: "Arte de El Diamante",
    pos: "50% 25%",
  },
] as const;

export default async function HomePage() {
  const sameAs = await loadSameAs();
  const released = colombiaToday() >= DIAMANTE_RELEASE;
  const press = pressCoverage.find((item) => item.url);

  return (
    <>
      {sameAs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(sameAs)) }}
        />
      )}

      {/* ── Hero: one photograph, the name, one sentence, two actions ── */}
      <section aria-label="Cristian Barbosa" className="relative flex h-[calc(100svh-4rem)] min-h-[560px] flex-col justify-end overflow-hidden">
        <Image
          src="/brand/cristian-jose-globo-muerte.jpg"
          alt="Cristian Barbosa junto al globo de la muerte, en pleno show"
          fill
          priority
          sizes="100vw"
          className={`${photoClass} object-[50%_8%] cb-slow-drift`}
        />
        {/* Neutral scrim under the text (the one gradient the house rules allow). */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,13,12,0.95)_0%,rgba(11,13,12,0.55)_45%,rgba(11,13,12,0)_75%)]" /* taste-skill-ignore: neutral scrim under text on a photo */ />
        <div className="relative px-5 pb-10 sm:px-8 lg:pb-14">
          <h1 className="font-display text-[23vw] font-black uppercase leading-[0.82] tracking-[-0.04em] text-chalk lg:text-[13vw]">
            Cristian
            <br />
            Barbosa
          </h1>
          <p className="mt-5 max-w-md text-lg leading-snug text-chalk sm:text-xl">
            4 veces campeón nacional de calistenia. Shows de fuego, calistenia y música en vivo.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href="/contacto?topic=shows"
              event={{ name: "cta_click", cta: "intent_shows", topic: "home_hero" }}
              className="bg-ember px-6 py-4 text-center text-base font-bold text-ink transition-colors hover:bg-chalk focus-visible:bg-chalk"
            >
              Contratar un show
            </TrackedLink>
            <TrackedLink
              href="/entrenar#sesion"
              event={{ name: "cta_click", cta: "intent_training", topic: "home_hero" }}
              className="bg-chalk px-6 py-4 text-center text-base font-bold text-ink transition-colors hover:bg-ember focus-visible:bg-ember"
            >
              Entrenar conmigo · $80.000
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* ── Three doors: what you can do here ───────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8">
        <Reveal>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-chalk sm:text-5xl">¿Qué buscas?</h2>
        </Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-6">
          {doors.map((door, i) => (
            <Reveal
              key={door.href}
              delay={i * 0.08}
              className={i === 0 ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5"}
            >
              <TrackedLink
                href={door.href}
                event={{ name: "cta_click", cta: door.cta, topic: "home_doors" }}
                className="group block"
              >
                <span className={`relative block overflow-hidden ${i === 0 ?"aspect-[4/3] lg:aspect-[4/4.6]" : "aspect-[16/9]"}`}>
                  <Image
                    src={door.src}
                    alt={door.alt}
                    fill
                    sizes={i === 0 ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 42vw, 100vw"}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{ objectPosition: door.pos }}
                  />
                </span>
                <span className="mt-4 flex items-baseline justify-between gap-4">
                  <span className="font-display text-3xl font-black uppercase tracking-tight text-chalk group-hover:text-ember sm:text-4xl">
                    {door.title}
                  </span>
                  <span aria-hidden="true" className="font-display text-3xl font-black text-ember transition-transform group-hover:translate-x-1">→</span>
                </span>
                <span className="mt-1 block text-base text-chalk">
                  {door.cta === "intent_music"
                    ? released
                      ? "El Diamante, mi primera canción de rap, ya está disponible."
                      : "El Diamante, mi primera canción de rap, sale el 15 de octubre."
                    : door.line}
                </span>
              </TrackedLink>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Three figures ───────────────────────────────────────────── */}
      <section className="bg-ink-raised">
        <dl className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 sm:grid-cols-3 sm:px-8">
          {[
            ["4", "títulos nacionales de calistenia"],
            [String(circusMunicipalityCount), "municipios recorridos con el Circo Santiago de Chile"],
            ["80.000", "personas lo vieron en el Pride de Medellín 2022"],
          ].map(([figure, line], i) => (
            <Reveal key={line} delay={i * 0.08}>
              <dt className="font-display text-6xl font-black tabular-nums text-ember sm:text-7xl">{figure}</dt>
              <dd className="mt-2 max-w-[28ch] text-base text-chalk">{line}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* ── Live thing: has he been to your town? ─────────────────── */}
      <section className="mx-auto grid max-w-[1400px] gap-8 px-5 py-24 sm:px-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-chalk">¿Ya estuvo en tu pueblo?</h2>
        </Reveal>
        <Reveal delay={0.08} className="lg:col-span-7 lg:col-start-6">
          <TownCheck />
        </Reveal>
      </section>

      {/* ── Showcase: band of unequal panels ──────────────────────── */}
      <section className="pt-[18vh]">
        <Reveal>
          <h2 className="px-5 font-display text-[28px] font-black uppercase tracking-tight text-chalk sm:px-8 lg:ml-[16.6%] lg:text-[44px]">El show</h2>
        </Reveal>
        <div className="cb-band mt-16 grid h-[84svh] grid-cols-[64fr_36fr] lg:flex lg:h-[68svh]">
          {[
            { src: "/brand/cristian-jose-globo-muerte.jpg", alt: "Cristian Barbosa junto al globo de la muerte en Támesis", grow: 5, pos: "50% 30%" },
            { src: "/brand/show-crowd-01.jpg", alt: "Cristian Barbosa con el público después de un show", grow: 2, pos: "50% 30%" },
            { src: "/brand/show-crowd-02.jpg", alt: "Cristian Barbosa con una familia junto a la moto del globo", grow: 3, pos: "50% 35%" },
            { src: "/brand/cristian-brand-art-01.png", alt: "Arte de Cristian Barbosa en escenario", grow: 2, pos: "50% 20%" },
          ].map((panel, i) => (
            <div
              key={panel.src}
              className="cb-band-panel relative min-w-0 overflow-hidden"
              style={{ ["--grow" as string]: panel.grow }}
            >
              <Image src={panel.src} alt={panel.alt} fill sizes="(min-width: 1024px) 40vw, 60vw" className={photoClass} style={{ objectPosition: panel.pos }} />
              {i === 0 && (
                <p className="absolute left-0 top-0 max-w-[20ch] bg-ink/75 p-4 text-[20px] font-bold leading-tight text-chalk lg:max-w-[16ch] lg:p-6 lg:text-[28px]">
                  15 minutos de fuego y calistenia
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="px-5 pt-4 text-base text-chalk sm:px-8">
          En los coliseos de Antioquia con el Circo Santiago de Chile, de 2024 a 2026.
        </p>
      </section>

      {/* ParticleBody: Cristian's own pick (2026-09-25), kept. */}
      <ParticleBody>
        <p className="text-[clamp(24px,2.4vw,32px)] font-semibold text-chalk">Artista. Performer. Atleta.</p>
      </ParticleBody>

      {/* ── Work: loose scatter with pauses ───────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 pb-[18vh] sm:px-8">
        <Reveal>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-chalk">Historias</h2>
        </Reveal>
        <div className="mt-16 grid gap-[72px] lg:grid-cols-12 lg:gap-y-[26vh]">
          <Story
            className="lg:col-span-6"
            ratio="aspect-[3/2]"
            name="Historia"
            href={blogPostPath("de-flaco-a-campeon-nacional")}
            src="/brand/cristian-hero-02.jpg"
            alt="Cristian Barbosa en la montaña"
            line="De flaco y con burlas a cuatro veces campeón nacional."
          />
          {press?.url && (
            <Story
              className="w-[82%] lg:col-span-7 lg:col-start-3 lg:w-full"
              ratio="aspect-video"
              name="Prensa"
              href={press.url}
              external
              src={press.image ?? "/brand/press-el-colombiano.jpg"}
              alt={`${press.outlet}: nota sobre Cristian Barbosa`}
              line={`${press.outlet} cuenta su historia (${press.year}).`}
            />
          )}
          {collabVideos[0] && (
            <figure className="lg:col-span-4 lg:col-start-2">
              <p className="mb-2 text-sm text-steel">Con {collabVideos[0].creator}</p>
              <InstagramEmbed url={collabVideos[0].url} title={`Cristian Barbosa con ${collabVideos[0].creator}`} />
            </figure>
          )}
        </div>
      </section>

      {/* ── Pricing: one plan as a sentence ───────────────────────── */}
      <section id="sesion-home" className="flex min-h-[80svh] flex-col justify-center bg-chalk px-5 py-20 text-ink sm:px-8">
        <Reveal>
          <h2 className="font-display text-[11vw] font-black uppercase leading-[1.08] tracking-[-0.03em] lg:text-[8.5vw]">
            70 minutos conmigo{" "}
            <span className="whitespace-nowrap bg-ember px-[0.15em] text-ink">$80.000</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid items-end gap-6 lg:grid-cols-12">
          <p className="text-[17px] lg:col-span-6 lg:text-xl">
            Una sesión 1:1 de calistenia a tu nivel, en Envigado o Medellín. Pagas seguro con Mercado Pago y
            coordinamos el día y el lugar por WhatsApp.
          </p>
          <div className="flex flex-col items-stretch gap-3 lg:col-span-3 lg:col-start-10 lg:items-end">
            <TrackedLink
              href="/entrenar#sesion"
              event={{ name: "cta_click", cta: "intent_training", topic: "home_pricing" }}
              className="bg-ink px-6 py-4 text-center font-bold text-chalk transition-colors hover:bg-ember hover:text-ink focus-visible:bg-ember"
            >
              Reservar mi sesión
            </TrackedLink>
            <GoLink slug={goLinks.whatsappCommercial} className="text-center font-semibold underline underline-offset-4 hover:text-ember">
              ¿Dudas? Escríbeme por WhatsApp
            </GoLink>
          </div>
        </div>
      </section>

      {/* ── CTA: one word is the button ───────────────────────────── */}
      <TrackedLink
        href="/contacto?topic=shows"
        event={{ name: "cta_click", cta: "intent_shows", topic: "home_final" }}
        className="group relative flex h-[46svh] flex-col justify-between bg-ember p-5 text-ink transition-colors hover:bg-ink hover:text-ember focus-visible:bg-ink focus-visible:text-ember sm:p-8 lg:h-[60svh]"
      >
        <span className="flex items-start justify-between gap-6">
          <span className="max-w-md text-[17px] font-semibold sm:text-xl">
            Cuéntame la fecha y el lugar de tu evento, y te respondo con el valor del show.
          </span>
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-8 w-8 shrink-0 sm:h-12 sm:w-12" fill="none" stroke="currentColor" strokeWidth="4">
            <path d="M12 36 36 12M16 12h20v20" />
          </svg>
        </span>
        <span className="font-display text-[30vw] font-black uppercase leading-[0.8] tracking-[-0.04em] lg:text-[26vw]">Cotiza</span>
      </TrackedLink>
    </>
  );
}

function Story({
  className,
  ratio,
  name,
  href,
  src,
  alt,
  line,
  external,
}: {
  className: string;
  ratio: string;
  name: string;
  href: string;
  src: string;
  alt: string;
  line: string;
  external?: boolean;
}) {
  return (
    <Reveal className={className}>
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group block">
        <span className="mb-2 block text-sm text-steel">{name}</span>
        <span className={`relative block overflow-hidden ${ratio}`}>
          <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 50vw, 90vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        </span>
        <span className="mt-3 block text-[clamp(15px,1.1vw,17px)] text-chalk group-hover:text-ember">{line}</span>
      </a>
    </Reveal>
  );
}
