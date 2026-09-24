import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { CheckoutLink } from "@/components/ui/CheckoutLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Entrenamiento de calistenia y coaching",
  description:
    "El camino de entrenamiento con Cristian Barbosa: comunidad gratuita, Entrena con Cristian Barbosa, curso digital y coaching personalizado.",
  path: "/entrenar",
});

/**
 * Four distinct offers, never blended into one undifferentiated list
 * (Block 04.2, docs/UNIVERSE_UX.md: "no mezclar las cuatro ofertas como
 * si fueran el mismo producto") — each its own group, its own CTA
 * phrase, its own `cta_click.cta` id, its own destination.
 *
 * Block 07 fix (docs/MASTER_BRIEF_BLOCK_07_10.md): the free WhatsApp
 * community and Facebook Subscription cards used to share both the
 * same intentId and the same destination (`/comunidad`) — fixed by
 * giving each its own destination. Facebook Subscription now has a
 * real price (29.900 COP/mes) and a real destination URL, so it routes
 * through the checkout abstraction (`CheckoutLink` — docs/COMMERCE.md)
 * instead of a bare outbound GoLink: `checkout_started` is now real,
 * attributed to the `facebook-subscription-standard` offer.
 */
const trackedGroups = [
  {
    eyebrow: "Gratis",
    title: "Comunidad gratuita",
    detail: "Conexión, activación y retos en WhatsApp. El punto de entrada para todos.",
    ctaLabel: "Quiero entrar a la comunidad",
    ctaId: "intent_community",
    href: "/comunidad",
  },
  {
    eyebrow: "Curso digital",
    title: "Aprende el método",
    detail: "El método de Cristian, a tu propio ritmo — cuándo y desde donde quieras.",
    ctaLabel: "Quiero aprender calistenia",
    ctaId: "intent_training_course",
    href: "/productos",
  },
];

const subscriptionGroup = {
  eyebrow: "Suscripción",
  title: "Entrena con Cristian Barbosa",
  detail: "Entrenamiento semanal, contenido exclusivo y lives — la experiencia de Facebook Subscription.",
  price: formatCents(2_990_000),
  offerSlug: "facebook-subscription-standard",
  ctaLabel: "Suscribirme por Facebook",
};

/**
 * Coaching still closes over WhatsApp with a human, not an automated
 * checkout — Cristian's own brief: "NO inventar checkout automatizado
 * para coaching todavía." The three tiers are catalog rows now
 * (`coaching-essential/performance/elite-quote`, purchase_type
 * 'quote', real price_cents — supabase/seed.sql), shown here for
 * comparison; the single CTA is a GoLink to the commercial WhatsApp
 * number, not a per-tier checkout.
 */
const coachingTiers = [
  { name: "Essential", price: formatCents(110_000_000) },
  { name: "Performance", price: formatCents(160_000_000) },
  { name: "Elite", price: formatCents(200_000_000) },
];

export default function EntrenarPage() {
  return (
    <>
      <PageHero
        tag="TRAIN"
        title="Entrena con Cristian"
        description="Del primer mensaje en WhatsApp al coaching de alto rendimiento — cuatro formas de entrar, un solo camino."
      />
      <section className="py-16">
        <Container>
          <div className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
            <div className="flex flex-col justify-between gap-4 bg-ink p-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ember">{trackedGroups[0].eyebrow}</p>
                <h2 className="mt-3 font-display text-xl font-black uppercase tracking-tight text-chalk">
                  {trackedGroups[0].title}
                </h2>
                <p className="mt-3 text-sm text-steel">{trackedGroups[0].detail}</p>
              </div>
              <TrackedLink
                event={{ name: "cta_click", cta: trackedGroups[0].ctaId, topic: "entrenar" }}
                href={trackedGroups[0].href}
                className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
              >
                {trackedGroups[0].ctaLabel}
              </TrackedLink>
            </div>

            <div className="flex flex-col justify-between gap-4 bg-ink p-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ember">{subscriptionGroup.eyebrow}</p>
                <h2 className="mt-3 font-display text-xl font-black uppercase tracking-tight text-chalk">
                  {subscriptionGroup.title}
                </h2>
                <p className="mt-3 text-sm text-steel">{subscriptionGroup.detail}</p>
                <p className="mt-3 font-mono text-sm uppercase tracking-widest text-chalk">
                  {subscriptionGroup.price} <span className="text-steel-dim">/ mes</span>
                </p>
              </div>
              <CheckoutLink
                offerSlug={subscriptionGroup.offerSlug}
                className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
              >
                {subscriptionGroup.ctaLabel}
              </CheckoutLink>
            </div>

            <div className="flex flex-col justify-between gap-4 bg-ink p-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ember">{trackedGroups[1].eyebrow}</p>
                <h2 className="mt-3 font-display text-xl font-black uppercase tracking-tight text-chalk">
                  {trackedGroups[1].title}
                </h2>
                <p className="mt-3 text-sm text-steel">{trackedGroups[1].detail}</p>
              </div>
              <TrackedLink
                event={{ name: "cta_click", cta: trackedGroups[1].ctaId, topic: "entrenar" }}
                href={trackedGroups[1].href}
                className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
              >
                {trackedGroups[1].ctaLabel}
              </TrackedLink>
            </div>

            {/* id="coaching" — the homepage's new "Coaching" card
                (site.ts) links straight to /entrenar#coaching, per
                Cristian's request 2026-08-28: its own entry point, same
                page and offer as before. scroll-mt accounts for the
                sticky header (h-16) so the anchor doesn't land the card
                flush under it. */}
            <div id="coaching" className="flex scroll-mt-24 flex-col justify-between gap-4 bg-ink p-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ember">Premium</p>
                <h2 className="mt-3 font-display text-xl font-black uppercase tracking-tight text-chalk">
                  Coaching personalizado
                </h2>
                <p className="mt-3 text-sm text-steel">
                  Programación, seguimiento y contacto directo con Cristian. Cada nivel se
                  cierra por WhatsApp, en conversación con Cristian — no hay checkout
                  automático todavía.
                </p>
                <dl className="mt-4 flex flex-col gap-1.5 border-t border-steel-dim/30 pt-4">
                  {coachingTiers.map((tier) => (
                    <div key={tier.name} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-steel">{tier.name}</dt>
                      <dd className="font-mono text-sm text-chalk">{tier.price}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <GoLink
                slug={goLinks.whatsappCommercial}
                className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
              >
                Quiero entrenar personalmente con Cristian
              </GoLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
