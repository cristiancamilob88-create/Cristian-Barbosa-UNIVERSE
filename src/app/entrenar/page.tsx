import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Entrenar",
  description:
    "El camino de entrenamiento con Cristian Barbosa: comunidad gratuita, Entrena con Cristian Barbosa, curso digital y coaching personalizado.",
  path: "/entrenar",
});

const tiers = [
  {
    name: "Comunidad gratuita",
    detail: "Conexión, activación y retos en WhatsApp. El punto de entrada para todos.",
    href: "/comunidad",
  },
  {
    name: "Entrena con Cristian Barbosa",
    detail:
      "Entrenamiento semanal, contenido exclusivo y lives — la experiencia de suscripción.",
    href: "/comunidad",
  },
  {
    name: "Curso digital",
    detail: "Aprende el método a tu ritmo.",
    href: "/productos",
  },
  {
    name: "Coaching Essential",
    detail: "Programación y seguimiento con acompañamiento directo.",
    href: "/contacto?topic=coaching-essential",
  },
  {
    name: "Coaching Performance",
    detail: "Un nivel más de personalización y contacto con Cristian.",
    href: "/contacto?topic=coaching-performance",
  },
  {
    name: "Coaching Elite",
    detail: "Experiencia premium, evaluación y métricas a la medida.",
    href: "/contacto?topic=coaching-elite",
  },
];

export default function EntrenarPage() {
  return (
    <>
      <PageHero
        tag="TRAIN"
        title="Entrena con Cristian"
        description="Del primer video en WhatsApp al coaching de alto rendimiento — un solo camino, seis niveles de compromiso."
      />
      <section className="py-16">
        <Container>
          <div className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
            {tiers.map((tier) => (
              <Link
                key={tier.name}
                href={tier.href}
                className="group flex flex-col gap-3 bg-ink p-8 transition-colors hover:bg-ink-raised"
              >
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk group-hover:text-ember">
                  {tier.name}
                </h2>
                <p className="text-sm text-steel">{tier.detail}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
