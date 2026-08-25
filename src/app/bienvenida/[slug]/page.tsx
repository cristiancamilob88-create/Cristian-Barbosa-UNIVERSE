import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GoLink } from "@/components/ui/GoLink";
import { CheckoutLink } from "@/components/ui/CheckoutLink";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { ContactForm } from "@/components/forms/ContactForm";
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
      <PageHero
        tag="BIENVENIDA"
        title={`¡Hola, ${greeting}!`}
        description="Gracias por escanear el código — este es el universo completo de Cristian Barbosa. Déjanos tus datos para entrar directo a la comunidad, o explora todo desde aquí."
      />
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
            <div className="flex flex-col gap-4 bg-ink p-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ember">Gratis · WhatsApp</p>
                <h3 className="mt-2 font-display text-lg font-black uppercase tracking-tight text-chalk">
                  Comunidad WhatsApp
                </h3>
                <p className="mt-2 text-sm text-steel">Conexión directa, noticias y retos.</p>
              </div>
              <GoLink
                slug={goLinks.whatsappCommunity}
                className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
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
                <p className="font-mono text-xs uppercase tracking-widest text-ember">Todo el universo</p>
                <h3 className="mt-2 font-display text-lg font-black uppercase tracking-tight text-chalk">
                  Entrenamiento, música, shows y más
                </h3>
                <p className="mt-2 text-sm text-steel">
                  Coaching, productos, marcas, eventos — todo lo que hace Cristian, en un solo lugar.
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
