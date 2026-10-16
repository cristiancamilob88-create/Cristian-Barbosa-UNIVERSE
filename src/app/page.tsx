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

const heroLinks = [
  { href: "/musica", label: "Música", cta: "intent_music" },
  { href: "/shows", label: "Shows", cta: "intent_shows" },
  { href: "/agenda", label: "Mapa y agenda", cta: "intent_events" },
  { href: "/entrenar", label: "Entrenar", cta: "intent_training" },
] as const;

const photoClass = "object-cover";

export default async function HomePage() {
  const sameAs = await loadSameAs();
  const released = colombiaToday() >= DIAMANTE_RELEASE;
  const press = pressCoverage.find((item) => item.url);

  const rail = [
    { text: "4 veces campeón nacional de calistenia", tone: "bg-chalk text-ink" },
    { text: `${circusMunicipalityCount} municipios con el circo`, tone: "bg-steel text-ink" },
    { text: "80.000 personas en el Pride de Medellín", tone: "bg-[#3a3f3b] text-chalk" },
    { text: released ? "El Diamante, ya disponible" : "El Diamante, 15 de octubre", tone: "bg-ink-raised text-chalk" },
  ];

  return (
    <>
      {sameAs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(sameAs)) }}
        />
      )}

      {/* ── Hero: name band and rails ─────────────────────────────── */}
      <section aria-label="Cristian Barbosa" className="grid gap-2 p-2 lg:h-[calc(100svh-4rem)] lg:min-h-[680px] lg:grid-rows-[170px_64px_1fr]">
        <div className="flex h-[110px] items-center justify-center overflow-hidden bg-ink-raised lg:h-auto">
          <h1 className="whitespace-nowrap font-display text-[26vw] font-black uppercase leading-[0.85] tracking-[-0.04em] text-chalk lg:text-[clamp(140px,14.4vw,220px)]">
            Cristian Barbosa
          </h1>
        </div>

        <nav aria-label="Lo esencial" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {heroLinks.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              event={{ name: "cta_click", cta: link.cta, topic: "home_hero" }}
              className="flex h-16 items-start bg-ink-raised p-4 text-base font-semibold text-chalk transition-colors hover:bg-chalk hover:text-ink focus-visible:bg-chalk focus-visible:text-ink"
            >
              {link.label}
            </TrackedLink>
          ))}
        </nav>

        <div className="grid min-h-0 gap-2 lg:grid-cols-12">
          {/* Left rail: portrait + five facts */}
          <div className="hidden min-h-0 gap-2 lg:col-span-2 lg:grid lg:grid-rows-[1.3fr_1fr]">
            <div className="relative min-h-0 overflow-hidden bg-ink-raised">
              <Image src="/brand/cristian-hero-02.jpg" alt="Cristian Barbosa en las montañas de Antioquia" fill sizes="16vw" priority className={`${photoClass} object-[50%_20%]`} />
            </div>
            <ul className="flex flex-col justify-end gap-1.5 bg-ink-raised p-4 text-sm text-chalk">
              <li>22 años</li>
              <li>Envigado, Antioquia</li>
              <li>Entrena desde los 11</li>
              <li>Circo Santiago de Chile</li>
              <li>Rapero: El Diamante</li>
            </ul>
          </div>

          {/* Centre: the show */}
          <div className="relative aspect-[4/3] overflow-hidden bg-ink-raised lg:col-span-8 lg:aspect-auto lg:min-h-0">
            <Image
              src="/brand/show-fan-lift-01.jpg"
              alt="Cristian Barbosa cargando a una asistente durante un show"
              fill
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className={`${photoClass} object-[50%_35%] cb-slow-drift`}
            />
            <p className="absolute inset-x-0 bottom-0 hidden bg-ink p-6 text-[clamp(24px,2.4vw,36px)] font-semibold leading-tight text-chalk lg:block lg:w-2/3">
              Calistenia, fuego y música en vivo.
            </p>
          </div>
          <p className="bg-ink p-4 text-[6vw] font-semibold leading-tight text-chalk lg:hidden">
            Calistenia, fuego y música en vivo.
          </p>

          {/* Right rail: light-to-dark facts, the action at the bottom */}
          <div className="grid grid-cols-2 gap-2 lg:col-span-2 lg:grid-cols-1 lg:grid-rows-5">
            {rail.map((tile) => (
              <p key={tile.text} className={`flex min-h-[88px] items-end p-3 text-[15px] font-semibold leading-snug ${tile.tone}`}>
                {tile.text}
              </p>
            ))}
            <TrackedLink
              href="/contacto?topic=shows"
              event={{ name: "cta_click", cta: "intent_shows", topic: "home_hero" }}
              className="col-span-2 flex min-h-[72px] items-end bg-ember p-3 text-base font-bold text-ink transition-colors hover:bg-chalk focus-visible:bg-chalk lg:col-span-1"
            >
              Contratar un show →
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* ── Signature move: the name and the claim, edge to edge ────── */}
      <div aria-hidden="true" className="cb-marquee mt-24 overflow-hidden bg-ember py-3 text-ink lg:mt-[150px]">
        <div className="cb-marquee-track flex w-max gap-12 whitespace-nowrap font-display text-[clamp(56px,9vw,140px)] font-black uppercase leading-[1.1] tracking-[-0.03em]">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex gap-12">
              <span>Cristian Barbosa</span>
              <span>4 veces campeón nacional</span>
              <span>{circusMunicipalityCount} municipios</span>
              <span>El Diamante</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats: quiet figure lines ─────────────────────────────── */}
      <section className="mx-auto grid max-w-[1400px] gap-12 px-5 py-[18vh] sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-6 lg:col-start-2">
          <Reveal>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk sm:ml-[156px]">En cifras</h2>
          </Reveal>
          <dl className="mt-14 flex flex-col gap-7">
            {[
              ["4", "títulos nacionales de calistenia: dos en Rionegro, uno en Envigado y Expofitness 2025."],
              ["2", "subcampeonatos nacionales, en Bucaramanga y en Cartago."],
              [String(circusMunicipalityCount), "municipios de Antioquia y Chocó con el Circo Santiago de Chile, desde junio de 2024."],
              ["80.000", "personas lo vieron en el Pride de Medellín, en julio de 2022."],
              ["11", "años tenía cuando empezó a entrenar, en Fusagasugá."],
            ].map(([figure, line], i) => (
              <Reveal key={figure + line} delay={i * 0.07}>
                <div className="grid grid-cols-[88px_1fr] items-baseline gap-6 sm:grid-cols-[132px_1fr]">
                  <dt className="text-right font-display text-2xl font-black tabular-nums text-chalk sm:text-[32px]">{figure}</dt>
                  <dd className="max-w-[40ch] text-base text-chalk sm:text-[17px]">{line}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
        <Reveal delay={0.2} className="relative aspect-square w-[56%] justify-self-end lg:col-span-3 lg:col-start-9 lg:mt-20 lg:w-full">
          <Image src="/brand/cristian-mountain-flex.jpg" alt="Cristian Barbosa en la montaña" fill sizes="(min-width: 1024px) 25vw, 56vw" className={photoClass} />
        </Reveal>
      </section>

      {/* ── Live thing: has he been to your town? ─────────────────── */}
      <section className="bg-ink-raised">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk sm:text-4xl">¿Ya estuvo en tu pueblo?</h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-7 lg:col-start-6">
            <TownCheck />
          </Reveal>
        </div>
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
          <Story
            className="w-[68%] justify-self-end lg:col-span-4 lg:col-start-9 lg:-mt-[80px] lg:w-full"
            ratio="aspect-[4/5]"
            name="Música"
            href="/musica"
            src="/brand/cristian-brand-art-01.png"
            alt="Arte de El Diamante"
            line={released ? "El Diamante ya está disponible: escúchala." : "El Diamante sale el 15 de octubre."}
          />
          <p className="text-xl text-chalk lg:col-span-4 lg:col-start-2 lg:self-center">
            Grabó su primera canción en un estudio dentro de un refugio de perros, en Caldas.
          </p>
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
