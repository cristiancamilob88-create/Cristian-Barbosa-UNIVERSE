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
        Crop tuned separately per breakpoint, not one value for both:
        this is a tall portrait photo, so the same object-position
        lands in a completely different part of the image depending on
        how wide vs. tall the container is (verified by screenshotting
        both — a shared value that looked right on mobile showed only
        background on desktop's much wider/shorter hero). Mobile: tight
        crop favoring chest/abs per Cristian's own ask ("que se me haga
        más el abdomen, no tanto la cara"). Desktop: taller box, less
        extreme position, same intent.
      */}
      <section className="relative h-[34vh] min-h-[240px] w-full overflow-hidden lg:h-[48vh]">
        <Image
          src="/brand/cristian-hero-01.jpg"
          alt="Cristian Barbosa"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[58%_100%] lg:object-[62%_84%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <div className="relative flex h-full flex-col justify-end px-6 pb-10 sm:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Cristian Barbosa</p>
          <h1 className="mt-3 max-w-xl font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-chalk sm:text-5xl">
            La calistenia es la belleza de la fortaleza
          </h1>
        </div>
      </section>

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

      <section className="border-b border-steel-dim/40 py-16">
        <Container className="flex flex-col items-center gap-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">Mira de qué se trata</p>
          <InstagramEmbed
            url="https://www.instagram.com/reel/DQcWOQMCUuN/"
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
                event={{ name: "cta_click", cta: "ver_universo_completo", topic: "general" }}
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
