import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GoLink } from "@/components/ui/GoLink";
import { PlanDiciembreForm } from "@/components/forms/PlanDiciembreForm";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Plan Diciembre — 12 semanas con Cristian Barbosa",
  description:
    "Entrenamiento de calistenia 1:1 a domicilio en Envigado, Las Palmas, Sabaneta y Llanogrande: 2 clases por semana, plan personalizado y app con tu rutina. 10 cupos.",
  path: "/entrenar/plan-diciembre",
});

/**
 * Plan Diciembre sign-up (2026-09-30). Every figure and promise here is
 * Cristian's own, from his sales script ("Plan Diciembre — Guion de
 * venta"): 12 weeks, 1:1 at home, 2 classes/week, personalized plan,
 * app follow-up, start/end evaluation, 1.000.000 COP for the full plan
 * (two payments) vs 400.000 COP/month, 10 spots, four zones, free
 * 20-minute assessment. Closes by conversation and is paid outside the
 * site — the form is a sign-up (lead + pending enrollment), not a
 * checkout (docs/TRAINING.md). Matches the `plan-diciembre-completo`
 * offer row (supabase/seed.sql).
 */

const includes = [
  {
    title: "Yo voy hasta ti",
    detail: "Entrenamiento 1 a 1, dos clases por semana, a domicilio o en un lugar cerca de tu casa.",
  },
  {
    title: "Un plan solo para ti",
    detail: "Programación hecha según tu nivel, aunque arranques de cero.",
  },
  {
    title: "Tu app con tu rutina",
    detail: "Ves tu rutina de la semana y del mes, marcas lo que cumpliste y yo reviso tu avance y te ajusto el plan.",
  },
  {
    title: "Mides tu progreso",
    detail: "Evaluación al inicio y al final: dominadas, fondos, estáticos y peso.",
  },
];

export default function PlanDiciembrePage() {
  return (
    <>
      <PageHero
        tag="PLAN DICIEMBRE"
        title="12 semanas con Cristian"
        description="No esperes a enero. Llega a diciembre más fuerte, más liviano y haciendo cosas que hoy no crees posibles: tu primera dominada, tu primer fondo o tu primer estático."
      />

      <section className="py-16">
        <Container>
          <div className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
            {includes.map((item) => (
              <div key={item.title} className="bg-ink p-8">
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">{item.title}</h2>
                <p className="mt-3 text-sm text-steel">{item.detail}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="flex flex-col gap-6 border border-ember/60 bg-ink-raised p-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ember">Solo 10 cupos · a domicilio</p>
              <p className="mt-4 font-mono text-sm text-steel">Mensual: {formatCents(40_000_000)}</p>
              <p className="mt-1 font-display text-4xl font-black uppercase tracking-tight text-chalk sm:text-5xl">
                {formatCents(100_000_000)}
              </p>
              <p className="mt-2 text-sm text-steel">
                El plan completo hasta diciembre — ahorras {formatCents(20_000_000)}. Lo puedes pagar en dos pagos.
              </p>
              <p className="mt-4 font-mono text-xs uppercase tracking-widest text-steel-dim">
                Envigado · Las Palmas · Sabaneta · Llanogrande
              </p>
            </div>
            <GoLink
              slug={goLinks.whatsappCommercial}
              className="text-sm text-steel underline underline-offset-4 hover:text-chalk"
            >
              ¿Dudas? Pide tu valoración gratis de 20 minutos
            </GoLink>
          </div>
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-16">
        <Container className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Inscripción</p>
          <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-chalk">Separa tu cupo</h2>
          <p className="mt-3 mb-8 text-steel">
            Déjame tus datos y te escribo por WhatsApp para agendar tu valoración y el día de arranque.
          </p>
          <PlanDiciembreForm />
          <p className="mt-10 text-sm text-steel">
            ¿Ya eres alumno?{" "}
            <Link href="/mi-plan/entrar" className="text-chalk underline underline-offset-4 hover:text-ember">
              Entra a tu plan
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
