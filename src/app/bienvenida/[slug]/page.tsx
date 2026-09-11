import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GoLink } from "@/components/ui/GoLink";
import { CheckoutLink } from "@/components/ui/CheckoutLink";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { ContactForm } from "@/components/forms/ContactForm";
import { InstagramEmbed } from "@/components/ui/InstagramEmbed";
import { buildMetadata } from "@/lib/seo";
import { formatCents } from "@/lib/format";
import { goLinks } from "@/config/site";
import { getPool } from "@/server/db/pool";
import { getActiveQrLanding } from "@/server/db/repositories/qrSource";

/**
 * A personalized welcome landing for a physical/printed QR code —
 * a colegio visit, a show, a future event — distinct from the 8
 * commercial pillar routes (never in navItems/sitemap, same precedent
 * as /go/[slug] and /admin/login: a real route with no public nav
 * entry, docs/COMMAND_CENTER.md's "no nav entry" pattern).
 *
 * The [slug] IS the qr_source.slug (docs/ATTRIBUTION.md) — the printed
 * QR's URL already carries ?utm_source=...&utm_medium=qr&utm_campaign=
 * ...&qr=<slug> on top of this path, so src/proxy.ts captures the
 * attribution cookie before this page even renders; this page only
 * needs the slug to look up qr_source → campaign for the greeting.
 * Submitting the form below (ContactForm → /api/lead) then attributes
 * the resulting contact/lead to that same campaign/source/qr
 * automatically — no new attribution mechanism, this is the existing
 * one (src/server/db/visitorContext.ts) doing its job.
 *
 * An unregistered/inactive slug redirects home instead of 404ing — a
 * QR scanned before its qr_source row exists (or after it's retired)
 * should never dead-end a real visitor.
 */

async function loadLanding(slug: string) {
  return getActiveQrLanding(getPool(), slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = await loadLanding(slug);
  const label = landing?.campaignName ?? "Cristian Barbosa Universe";

  return buildMetadata({
    title: "Bienvenida",
    description: `Bienvenida para ${label} — entrenamiento, comunidad, música, shows y más, todo en un solo lugar.`,
    path: `/bienvenida/${slug}`,
    noindex: true,
  });
}

export default async function BienvenidaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = await loadLanding(slug);
  if (!landing) redirect("/");

  const greeting = landing.campaignName ?? landing.sourceLabel ?? "bienvenido";

  return (
    <>
      {/* Full-bleed brand hero — first real photo of Cristian used
          anywhere in the app (2026-08-25). Deliberately above the
          personalized PageHero below, not replacing it: this is the
          "wow" moment, the greeting is the personalization. */}
      {/*
        The source file itself is pre-cropped (public/brand/cristian-hero-02.jpg
        was replaced with a version cropped to face-through-abs, sky
        already removed) instead of fighting object-position per
        breakpoint against a tall portrait source — that approach broke
        on desktop the first two times (verified by screenshot each
        time, not assumed) because the same percentage lands in a wildly
        different part of a portrait photo depending on how wide vs.
        tall the container is. Cristian's correction after seeing v1:
        wanted face AND chest AND abs visible together, only the
        sky/mountains cut — not a face-vs-abs tradeoff. Pre-cropping the
        source to roughly that framing (aspect ~1.14, much closer to a
        typical hero banner) means one modest object-position now works
        for both breakpoints, verified against real screenshots again.
      */}
      {/*
        Desktop switches to object-contain, not another cropped
        object-position: on a very wide/short viewport, showing
        face-through-abs via object-cover would need a hero taller than
        the viewport itself (verified by the numbers, not guessed — a
        cover crop that fits the full face-to-abs span works out to
        >100vh at 1440px wide). object-contain shows the whole photo,
        letterboxed by bg-ink (matches the page background, so the
        bars read as intentional framing, not a bug) — the only way to
        keep Cristian's actual ask (face AND chest AND abs, only the
        sky cut) true on both a phone and a wide desktop.
      */}
      <section className="relative h-[46vh] min-h-[320px] w-full overflow-hidden bg-ink lg:h-[70vh]">
        <Image
          src={landing.heroImageUrl ?? "/brand/cristian-hero-02.jpg"}
          alt="Cristian Barbosa"
          fill
          priority
          sizes="100vw"
          // The fine-tuned crop (52% 30%) was measured against the
          // default photo specifically (see the comment above) — a
          // per-campaign override (0012) gets its own tuned position.
          // For cristian-mountain-flex.jpg: Cristian's own correction
          // (2026-09-04) — "el cielo no me importa, me importa mi
          // cuerpo" — most of the frame is sky above the pose, so a
          // plain center crop buried the muscles low in frame, right
          // where the title's gradient/text sit. 90% anchors near the
          // bottom of the source instead, verified against real crops
          // at both a phone-width and a wider box (src/scripts one-off,
          // not checked in) before landing on this value. Desktop
          // keeps object-contain — this fix targets the phone view,
          // the realistic case for someone scanning a printed QR.
          className={
            landing.heroImageUrl
              ? "object-cover object-[50%_90%] lg:object-contain"
              : "object-cover object-[52%_30%] lg:object-contain"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <div className="relative flex h-full flex-col justify-end px-6 pb-10 sm:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Cristian Barbosa</p>
          <h1 className="mt-3 max-w-xl font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-chalk sm:text-5xl">
            La calistenia es la belleza de la fortaleza
          </h1>
        </div>
      </section>

      {/* Small "menú principal" link between the hero and the BIENVENIDA
          block (Cristian's explicit request, 2026-09-11, right after
          seeing the Támesis page live — he wants it back, but in this
          exact spot, not where the old ver_universo_completo_top lived
          inside PageHero). Deliberately subdued (small, outline, steel)
          rather than a full-size button: the whole point of that same
          day's redesign (docs/UNIVERSE_UX.md §9) was that an exit link
          this prominent competes with "Unirme a la comunidad" further
          down — a quiet menu affordance here satisfies the request
          without recreating that problem. */}
      <div className="border-b border-steel-dim/40 bg-ink py-3 text-center">
        <TrackedLink
          href="/"
          event={{ name: "cta_click", cta: "ver_universo_completo_hero", topic: "general" }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-steel transition-colors hover:text-chalk"
        >
          Ver todo el universo — menú principal
          <span aria-hidden="true">→</span>
        </TrackedLink>
      </div>

      {/* Logo watermarked into the background, per Cristian's own ask
          ("como si perdiera transparencia") — the text/layout underneath
          is untouched, just a faint brand mark behind it. */}
      <div className="relative overflow-hidden">
        <Image
          src="/brand/cristian-logo-01.png"
          alt=""
          aria-hidden="true"
          fill
          className="pointer-events-none select-none object-cover opacity-[0.08]"
        />
        <PageHero
          tag="BIENVENIDA"
          title={`¡Hola, ${greeting}!`}
          description="Gracias por escanear el código — este es el universo completo de Cristian Barbosa: entrenamiento, comunidad, música, shows y lo que viene. Déjanos tus datos para entrar directo a la comunidad, o explora todo desde aquí."
        />
      </div>

      {/* Short per-campaign announcement (0010) — Cristian's request
          2026-09-04, before sharing the Concordia link: what today's
          event actually is. Only renders when the campaign has one set;
          every other /bienvenida/[slug] page is unaffected. */}
      {landing.eventDescription && (
        <section className="border-b border-steel-dim/40 bg-ink-raised py-8">
          <Container className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Hoy</p>
            <p className="mt-2 text-lg text-chalk">{landing.eventDescription}</p>
          </Container>
        </section>
      )}

      {/* Real press coverage (0011) — Cristian's request 2026-09-04:
          a verifiable link beats asking a visitor to go search Google
          themselves. Only renders when the campaign has one set. */}
      {landing.pressUrl && (
        <section className="border-b border-steel-dim/40 py-6">
          <Container className="flex flex-col items-center gap-3 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">En los medios</p>
            {/* Real photo of the coverage (0012), when the campaign has
                one — a verifiable clipping reads stronger than the link
                alone. The link/label stays too either way. */}
            {landing.pressImageUrl && (
              <TrackedLink
                href={landing.pressUrl}
                external
                event={{ name: "cta_click", cta: "press_link_image", topic: "press" }}
                className="block w-full max-w-xs overflow-hidden border border-steel-dim/40"
              >
                <Image
                  src={landing.pressImageUrl}
                  alt={landing.pressLabel ?? "Recorte de prensa"}
                  width={480}
                  height={640}
                  className="h-auto w-full object-cover"
                />
              </TrackedLink>
            )}
            <TrackedLink
              href={landing.pressUrl}
              external
              event={{ name: "cta_click", cta: "press_link_text", topic: "press" }}
              className="inline-block text-sm text-chalk underline decoration-tide underline-offset-4 hover:text-tide"
            >
              {landing.pressLabel ?? "Leer la entrevista"} →
            </TrackedLink>
          </Container>
        </section>
      )}

      <section className="border-b border-steel-dim/40 py-16">
        <Container className="flex flex-col items-center gap-6 text-center">
          {/* WhatsApp CTA(s) above the video, not below (Cristian's
              correction, 2026-08-28: "la gente, pum, presione ahí" —
              the join button should be the very first thing a visitor
              can act on, before they even watch). The full cards
              further down stay as-is; this is a fast path, not a
              replacement.

              Redesigned 2026-09-11 against Concordia's real numbers
              (docs/UNIVERSE_UX.md §9): 24 unique visitors, only 1 ever
              clicked to join the community, zero registrations — while
              "Ver todo el universo" (an exit, not a conversion) was the
              single most-clicked thing on the page. Every CTA here was
              the same visual weight, competing for attention with the
              one action that actually matters. Fix: one big, filled,
              unmissable primary action (join the community), everything
              else demoted to a smaller secondary row below it — and the
              "Ver todo el universo" link that lived here is gone
              entirely (the one in the "Hay más" card further down,
              después de todo lo demás, is enough of an exit hatch). */}
          <div className="flex flex-col items-center gap-4">
            <GoLink
              slug={goLinks.whatsappCommunity}
              className="inline-flex items-center gap-2 bg-tide px-8 py-4 text-base font-bold uppercase tracking-wide text-ink transition-colors hover:bg-tide/90"
            >
              Unirme a la comunidad
              <span aria-hidden="true">→</span>
            </GoLink>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {landing.secondaryWhatsappSlug && (
                <GoLink
                  slug={landing.secondaryWhatsappSlug}
                  className="inline-flex items-center border border-ember px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
                >
                  Unirme — {landing.secondaryWhatsappLabel ?? "grupo exclusivo"}
                </GoLink>
              )}
              {/* Redes, right alongside the WhatsApp CTA (Cristian's ask,
                  2026-09-04) — /redes is an internal route (TrackedLink,
                  not GoLink), same intentId as its own navItems entry. */}
              <TrackedLink
                href="/redes"
                event={{ name: "cta_click", cta: "intent_social", topic: "network" }}
                className="inline-flex items-center border border-chalk px-5 py-2 text-xs font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
              >
                Seguir en redes
              </TrackedLink>
            </div>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">Mira de qué se trata</p>
          <InstagramEmbed
            url={landing.instagramReelUrl ?? "https://www.instagram.com/reel/DQcWOQMCUuN/"}
            title="Presentación de Cristian Barbosa"
          />
        </Container>
      </section>

      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">
              Regístrate
            </h2>
            <p className="mt-2 text-sm text-steel">
              Así podemos avisarte de entrenamientos, retos y contenido nuevo.
            </p>
            <div className="mt-6">
              <ContactForm initialTopic="entrenar" />
            </div>
          </div>

          <div className="flex flex-col gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40">
            <div className="flex flex-col gap-4 bg-ink p-6 ring-1 ring-inset ring-tide/40">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-tide">Empieza aquí · Gratis</p>
                <h3 className="mt-2 font-display text-lg font-black uppercase tracking-tight text-chalk">
                  Comunidad WhatsApp
                </h3>
                <p className="mt-2 text-sm text-steel">Conexión directa, noticias y retos.</p>
              </div>
              <GoLink
                slug={goLinks.whatsappCommunity}
                className="inline-flex w-fit items-center border border-tide px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-tide transition-colors hover:bg-tide hover:text-ink"
              >
                Unirme por WhatsApp
              </GoLink>
            </div>

            {/* Second, campaign-specific WhatsApp group (0009) —
                Cristian's request 2026-08-28: a niche group for a
                specific school/event, alongside (not instead of) the
                general community group above. Only renders when a
                campaign actually has one configured. */}
            {landing.secondaryWhatsappSlug && (
              <div className="flex flex-col gap-4 bg-ink p-6 ring-1 ring-inset ring-ember/40">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-ember">Grupo exclusivo</p>
                  <h3 className="mt-2 font-display text-lg font-black uppercase tracking-tight text-chalk">
                    {landing.secondaryWhatsappLabel ?? "Grupo de WhatsApp"}
                  </h3>
                  <p className="mt-2 text-sm text-steel">Solo para quienes escanearon aquí.</p>
                </div>
                <GoLink
                  slug={landing.secondaryWhatsappSlug}
                  className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
                >
                  Unirme por WhatsApp
                </GoLink>
              </div>
            )}

            <div className="flex flex-col gap-4 bg-ink p-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ember">Suscripción</p>
                <h3 className="mt-2 font-display text-lg font-black uppercase tracking-tight text-chalk">
                  Entrena con Cristian Barbosa
                </h3>
                <p className="mt-2 text-sm text-steel">Entrenamiento semanal y contenido exclusivo.</p>
                <p className="mt-2 font-mono text-sm uppercase tracking-widest text-chalk">
                  {formatCents(2_990_000)} <span className="text-steel-dim">/ mes</span>
                </p>
              </div>
              <CheckoutLink
                offerSlug="facebook-subscription-standard"
                className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
              >
                Suscribirme por Facebook
              </CheckoutLink>
            </div>

            <div className="flex flex-col gap-4 bg-ink p-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ember">Hay más</p>
                <h3 className="mt-2 font-display text-lg font-black uppercase tracking-tight text-chalk">
                  ¿Qué está construyendo Cristian?
                </h3>
                <p className="mt-2 text-sm text-steel">
                  Música, shows, marcas, productos — el entrenamiento es solo la puerta de entrada.
                </p>
              </div>
              <TrackedLink
                event={{ name: "cta_click", cta: "ver_universo_completo_bottom", topic: "general" }}
                href="/"
                className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
              >
                Ver todo el universo
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
