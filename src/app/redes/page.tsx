import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { GoLink } from "@/components/ui/GoLink";
import { LinkIcon } from "@/components/ui/LinkIcon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { goLinks, navItems } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { getPool } from "@/server/db/pool";
import { listActiveSocialProfiles } from "@/server/db/repositories/socialProfile";
import type { SocialProfile } from "@/types/crm";

export const metadata: Metadata = buildMetadata({
  title: "Redes y contacto",
  description:
    "Clases personalizadas, shows en vivo, música y todas las redes oficiales de Cristian Barbosa, 4 veces campeón nacional de calistenia.",
  path: "/redes",
});

// This route queries the database directly (unlike the shared Header/Footer,
// which stay static — see docs/SOCIAL_ROUTING.md for why) since it's the
// one page whose entire purpose is presenting social_profile fully.
export const dynamic = "force-dynamic";

/**
 * /redes doubles as Cristian's link-in-bio page (the URL in his Instagram/
 * TikTok bios, 2026-10-07), so it's ordered by what he wants people to do
 * first — WhatsApp contact, then training, shows, music, the free
 * community — and only then the full list of channels. Destinations still
 * come only from social_profile (via GoLink) and navItems (via
 * TrackedLink); this page decides order and copy, never URLs. A featured
 * slot whose profile is inactive simply doesn't render.
 */

const TOPIC = "redes";

function route(intentId: string) {
  const item = navItems.find((nav) => nav.intentId === intentId);
  if (!item) throw new Error(`navItems has no route with intentId ${intentId}`);
  return item;
}

const cardClass =
  "group flex items-center gap-4 border border-steel-dim/40 bg-ink-raised p-4 transition-colors hover:border-ember";

function CardBody({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  return (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink text-chalk group-hover:text-ember">
        <LinkIcon name={icon} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-lg font-black uppercase leading-tight tracking-tight text-chalk">
          {title}
        </span>
        <span className="block text-sm text-steel">{detail}</span>
      </span>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ember">{title}</h2>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  );
}

export default async function RedesPage() {
  const profiles = await listActiveSocialProfiles(getPool());
  const bySlug = new Map(profiles.map((profile) => [profile.slug, profile]));
  const inCategory = (category: string) => profiles.filter((profile) => profile.category === category);

  const whatsapp = bySlug.get(goLinks.whatsappCommercial);
  const subscription = bySlug.get(goLinks.facebookSubscription);
  const freeCommunity = [goLinks.whatsappCommunity, goLinks.instagramCommunity]
    .map((slug) => bySlug.get(slug))
    .filter((profile): profile is SocialProfile => profile !== undefined);
  const socials = inCategory("social");
  const support = inCategory("support");

  const training = route("intent_training");
  const shows = route("intent_shows");
  const music = route("intent_music");

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
      <header className="flex flex-col items-center text-center">
        <Image
          src="/brand/cristian-hero-02.jpg"
          alt="Cristian Barbosa"
          width={112}
          height={112}
          priority
          className="h-28 w-28 rounded-full border-2 border-ember object-cover"
        />
        <h1 className="mt-5 font-display text-4xl font-black uppercase leading-none tracking-tight text-chalk">
          Cristian Barbosa
        </h1>
        <p className="mt-3 text-base text-chalk">🏆 4 veces Campeón Nacional de Calistenia 🇨🇴</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-steel">
          Clases · Shows · Música · Embajador Club Nativos
        </p>
      </header>

      {whatsapp ? (
        <GoLink
          slug={whatsapp.slug}
          className="mt-8 flex items-center gap-4 bg-ember p-5 text-ink transition-colors hover:bg-rust"
        >
          <LinkIcon name="whatsapp" className="h-8 w-8 shrink-0" />
          <span>
            <span className="block font-display text-xl font-black uppercase leading-tight tracking-tight">
              Escríbeme por WhatsApp
            </span>
            <span className="block text-sm font-medium">Clases, asesorías, shows o cualquier duda</span>
          </span>
        </GoLink>
      ) : null}

      <Section title="Entrena conmigo">
        <TrackedLink
          event={{ name: "cta_click", cta: training.intentId, topic: TOPIC }}
          href={training.href}
          className={cardClass}
        >
          <CardBody
            icon="training"
            title="Clases personalizadas"
            detail="A domicilio en Envigado y Medellín, a tu ritmo"
          />
        </TrackedLink>
        {subscription ? (
          <GoLink slug={subscription.slug} className={cardClass}>
            <CardBody icon="facebook" title={subscription.label} detail="Suscripción exclusiva en Facebook" />
          </GoLink>
        ) : null}
      </Section>

      <Section title="Shows y eventos">
        <TrackedLink
          event={{ name: "cta_click", cta: shows.intentId, topic: TOPIC }}
          href={shows.href}
          className={cardClass}
        >
          <CardBody
            icon="show"
            title="Contrata un show en vivo"
            detail="Eventos, discotecas, alcaldías, empresas y colegios"
          />
        </TrackedLink>
      </Section>

      <Section title="Música">
        <TrackedLink
          event={{ name: "cta_click", cta: music.intentId, topic: TOPIC }}
          href={music.href}
          className={cardClass}
        >
          <CardBody icon="music" title="Mi música" detail="Lanzamientos y la historia detrás de cada canción" />
        </TrackedLink>
      </Section>

      {freeCommunity.length > 0 ? (
        <Section title="Comunidad gratis">
          {freeCommunity.map((profile) => (
            <GoLink key={profile.id} slug={profile.slug} className={cardClass}>
              <CardBody
                icon={profile.platform}
                title={profile.label}
                detail={profile.platform === "whatsapp" ? "Tips, retos y novedades, gratis" : "La comunidad que entrena conmigo"}
              />
            </GoLink>
          ))}
        </Section>
      ) : null}

      {socials.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Sígueme</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {socials.map((profile) => (
              <li key={profile.id}>
                <GoLink
                  slug={profile.slug}
                  className="group flex h-full flex-col items-center gap-2 border border-steel-dim/40 bg-ink-raised p-4 text-center transition-colors hover:border-ember"
                >
                  <LinkIcon name={profile.platform} className="h-7 w-7 text-chalk group-hover:text-ember" />
                  <span className="text-sm text-chalk">{profile.label}</span>
                </GoLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {support.length > 0 ? (
        <Section title="Apóyame">
          {support.map((profile) => (
            <GoLink key={profile.id} slug={profile.slug} className={cardClass}>
              <CardBody
                icon={profile.platform === "paypal" ? "paypal" : "support"}
                title={profile.label}
                detail="Aporte voluntario para seguir creando"
              />
            </GoLink>
          ))}
        </Section>
      ) : null}
      </div>
    </Container>
  );
}
