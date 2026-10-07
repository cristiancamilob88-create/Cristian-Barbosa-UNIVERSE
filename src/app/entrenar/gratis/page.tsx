import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { CheckoutLink } from "@/components/ui/CheckoutLink";
import { FreeSignupForm } from "@/components/forms/FreeSignupForm";
import { buildMetadata } from "@/lib/seo";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Rutinas gratis de calistenia con Cristian Barbosa",
  description:
    "Crea tu cuenta gratis y entrena con las rutinas de Cristian Barbosa: rutina semanal, cronómetro, pruebas de máximo de flexiones, dominadas y fondos, y videos de cada ejercicio.",
  path: "/entrenar/gratis",
});

/**
 * The free tier's front door (2026-10-07, docs/TRAINING.md "Free tier") —
 * where Cristian's TikTok/Instagram bio link points. Says in three steps
 * what to do, takes the sign-up right here, and shows the two paid ways
 * up (Facebook subscription, 1:1 Plan Diciembre) underneath.
 */

const steps = [
  { n: "1", title: "Crea tu cuenta", detail: "Tu nombre, tu correo y tu objetivo. Te llega un código para entrar, sin contraseña." },
  { n: "2", title: "Entrena tu rutina", detail: "Cada semana ves qué hacer, marcas lo que cumples y cronometras cuánto te demoras." },
  {
    n: "3",
    title: "Mide tu progreso",
    detail: "Cada 2–4 semanas haz tu prueba de máximo de flexiones, dominadas, fondos y plancha, y mira cómo subes.",
  },
];

const features = [
  "Rutina semanal para empezar desde cero",
  "Cronómetro para cada entrenamiento",
  "Pruebas de máximo con tu gráfica de progreso",
  "Biblioteca de ejercicios con videos de cómo se hace cada uno",
  "En el celular la agregas a la pantalla de inicio, como una app",
];

export default function RutinasGratisPage() {
  return (
    <>
      <PageHero
        tag="GRATIS"
        title="Entrena gratis con Cristian"
        description="Tu rutina de calistenia, tu cronómetro y tu progreso en un solo lugar. Gratis, desde tu celular."
      >
        {/* Visitors from TikTok land on a phone — the sign-up is below the fold, so the hero jumps straight to it. */}
        <TrackedLink
          event={{ name: "cta_click", cta: "intent_free_app", topic: "entrenar_gratis_hero" }}
          href="#registro"
          className="mt-8 inline-flex w-fit items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk"
        >
          Crear mi cuenta gratis
        </TrackedLink>
      </PageHero>

      <section className="py-14">
        <Container>
          <ol className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="flex flex-col gap-2 bg-ink p-6">
                <span className="font-display text-4xl font-black text-ember">{step.n}</span>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">{step.title}</h2>
                <p className="text-sm text-steel">{step.detail}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="pb-16">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Qué incluye</p>
            <ul className="mt-4 flex flex-col gap-3">
              {features.map((f) => (
                <li key={f} className="flex gap-3 text-chalk">
                  <span className="text-ember" aria-hidden>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div id="registro" className="scroll-mt-24 border border-ember/60 bg-ink-raised p-6 sm:p-8">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk">Crea tu cuenta gratis</h2>
            <p className="mb-6 mt-2 text-sm text-steel">Toma menos de un minuto.</p>
            <FreeSignupForm />
          </div>
        </Container>
      </section>

      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">¿Quieres más?</p>
          <div className="mt-6 grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
            <div className="flex flex-col justify-between gap-4 bg-ink p-8">
              <div>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">Suscripción</h2>
                <p className="mt-3 text-sm text-steel">
                  Entrenamiento semanal, contenido exclusivo y lives con Cristian — en Facebook.
                </p>
                <p className="mt-3 font-mono text-sm uppercase tracking-widest text-chalk">
                  {formatCents(2_990_000)} <span className="text-steel-dim">/ mes</span>
                </p>
              </div>
              <CheckoutLink
                offerSlug="facebook-subscription-standard"
                className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
              >
                Suscribirme
              </CheckoutLink>
            </div>
            <div className="flex flex-col justify-between gap-4 bg-ink p-8">
              <div>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">Entrena 1:1 con Cristian</h2>
                <p className="mt-3 text-sm text-steel">
                  Plan Diciembre: 12 semanas, clases a domicilio y un plan hecho solo para ti.
                </p>
              </div>
              <TrackedLink
                event={{ name: "cta_click", cta: "intent_plan_diciembre", topic: "entrenar_gratis" }}
                href="/entrenar/plan-diciembre"
                className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
              >
                Ver el Plan Diciembre
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
