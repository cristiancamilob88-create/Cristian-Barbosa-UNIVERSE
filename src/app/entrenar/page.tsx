import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Entrenar",
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
 * Block 07 fix: the free WhatsApp community and Facebook Subscription
 * cards used to share both the same intentId (`intent_community`) and
 * the same destination (`/comunidad`), so neither offer's clicks were
 * distinguishable in analytics from here — exactly what the "no mezclar
 * ofertas" rule warns against (docs/MASTER_BRIEF_BLOCK_07_10.md, "Block
 * 07"). Each `TrackedLink`-based card here now points straight at its
 * real destination instead of funneling through /comunidad's own menu.
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
  {
    eyebrow: "Premium",
    title: "Coaching personalizado",
    detail: "Programación, seguimiento y contacto directo con Cristian — tres niveles: Essential, Performance, Elite.",
    ctaLabel: "Quiero entrenar personalmente con Cristian",
    ctaId: "intent_training_coaching",
    href: "/contacto?topic=coaching",
  },
];

/**
 * Facebook Subscription is a GoLink, not a TrackedLink, on purpose —
 * same reasoning as /comunidad's own card for it: it's an outbound
 * destination measured server-side (social_click, via /go/[slug],
 * distinguishable from every other outbound click by its own
 * `facebook-subscription` slug — docs/ANALYTICS_ENGINE.md). Rendered
 * separately from `trackedGroups` because its link component differs.
 */
const subscriptionGroup = {
  eyebrow: "Suscripción",
  title: "Entrena con Cristian Barbosa",
  detail: "Entrenamiento semanal, contenido exclusivo y lives — la experiencia de Facebook Subscription.",
  ctaLabel: "Ver en Facebook",
};

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
              </div>
              <GoLink
                slug={goLinks.facebookSubscription}
                className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
              >
                {subscriptionGroup.ctaLabel}
              </GoLink>
            </div>

            {trackedGroups.slice(1).map((group) => (
              <div key={group.title} className="flex flex-col justify-between gap-4 bg-ink p-8">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-ember">{group.eyebrow}</p>
                  <h2 className="mt-3 font-display text-xl font-black uppercase tracking-tight text-chalk">
                    {group.title}
                  </h2>
                  <p className="mt-3 text-sm text-steel">{group.detail}</p>
                </div>
                <TrackedLink
                  event={{ name: "cta_click", cta: group.ctaId, topic: "entrenar" }}
                  href={group.href}
                  className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
                >
                  {group.ctaLabel}
                </TrackedLink>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
