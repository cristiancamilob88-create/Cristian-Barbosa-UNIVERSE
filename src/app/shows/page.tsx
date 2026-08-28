import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

/**
 * Real photos from Cristian's own shows (2026-08-28) — confirmed with
 * him individually before shipping: the fans/attendees pictured gave
 * their consent when the photo was taken (parents present for the
 * minors in one shot), and the friend in the fitness-expo photo okayed
 * her own image too. Never assumed — asked and answered per photo.
 */
const actionPhotos = [
  { src: "/brand/show-fan-lift-01.jpg", alt: "Cristian Barbosa en un evento fitness" },
  { src: "/brand/show-crowd-01.jpg", alt: "Cristian Barbosa con público en uno de sus shows" },
  { src: "/brand/show-crowd-02.jpg", alt: "Cristian Barbosa con público en uno de sus shows" },
];

export const metadata: Metadata = buildMetadata({
  title: "Shows",
  description:
    "Shows en vivo de Cristian Barbosa para empresas, colegios, ferias, festivales, productoras y eventos privados o masivos.",
  path: "/shows",
});

const audiences = [
  "Empresas",
  "Colegios",
  "Ferias",
  "Festivales",
  "Productoras",
  "Eventos privados",
  "Quince años",
  "Rooftops",
  "Eventos masivos",
  "Circo / espectáculos",
];

/**
 * Starting packages, not 15 finished PDF proposals yet (docs/
 * MASTER_BRIEF_BLOCK_07_10.md, "07.5" — "primero construir la
 * arquitectura web comercial. Posteriormente se podrán crear
 * propuestas PDF específicas"). No price/scope was invented for any of
 * these — they're segments the commercial conversation starts from,
 * not fixed packages with a fixed price yet.
 */
const packages = [
  { name: "Corporativo", detail: "Activaciones y shows para empresas — eventos internos, lanzamientos, convenciones." },
  { name: "Productoras / festivales", detail: "Shows dentro de una producción o cartel más grande." },
  { name: "Colegios", detail: "Formato adaptado a audiencia escolar, con enfoque en disciplina y esfuerzo." },
  { name: "Eventos privados", detail: "Quince años, celebraciones y experiencias a medida." },
  { name: "Rooftops / venues", detail: "Formato reducido, ideal para espacios íntimos." },
];

export default function ShowsPage() {
  return (
    <>
      {/* Brand art (Cristian's own AI-generated key art, confirmed with
          him 2026-08-28 — not a documentary photo, used here as a
          backdrop the same way a poster/key-art image would be, never
          captioned as a real moment). */}
      <div className="relative overflow-hidden">
        <Image
          src="/brand/cristian-brand-art-01.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-ink/60" />
        {/*
          The REAL bug behind the muted title (found by sampling actual
          rendered pixels, not by re-guessing gradient values a 3rd
          time): the Image and the scrim div above are `absolute`, which
          puts them in the browser's "positioned, z-index:auto" paint
          bucket. PageHero's <section> has no `position` of its own
          (static) — and per the CSS painting-order spec, static in-flow
          content paints BEFORE positioned siblings in the same stacking
          context, no matter its order in the DOM. So the image + scrim
          were painting ON TOP of the title, not behind it — the text
          was never actually covering the art, no matter how the
          gradient/opacity was tuned. Wrapping PageHero in its own
          `relative z-10` promotes it into that same positioned bucket,
          where DOM order (this div comes after the image/scrim) finally
          decides paint order correctly. Confirmed by sampling real pixel
          RGB values before and after — text-chalk (#f3f1ea) now actually
          reaches the screen at the title's position, not before.
        */}
        <div className="relative z-10">
          <PageHero
            tag="SHOWS"
            title="Shows"
            description="Un show construido sobre disciplina física real, adaptado al formato de tu evento o institución."
            // Neon glow, Cristian's own request 2026-08-28 ("tipo efecto
            // neón") — a layered ember text-shadow (tight bright core +
            // two wider, softer halos), the classic neon-tube look. Ember
            // is already this design system's "stage light" accent
            // (globals.css), so a warm glow fits the theme instead of
            // fighting it. Only /shows opts in — every other PageHero
            // call site is unaffected.
            glowClassName="[text-shadow:0_0_8px_rgba(242,36,26,0.9),0_0_24px_rgba(242,36,26,0.55),0_0_48px_rgba(242,36,26,0.3)]"
          >
            <div className="mt-8 flex flex-wrap gap-4">
            {/* Solid bg-ink/70 backdrop added 2026-08-28 — Cristian's
                own report: over the new brand-art hero background,
                these outline-only buttons (border + text color, no
                fill until hover) lost contrast and "no resaltaban". */}
            <TrackedLink
              event={{ name: "cta_click", cta: "intent_shows", topic: "shows" }}
              href="/contacto?topic=shows"
              className="inline-flex w-fit items-center border border-ember bg-ink/70 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember backdrop-blur-sm transition-colors hover:bg-ember hover:text-ink"
            >
              Quiero contratar un show
            </TrackedLink>
            <GoLink
              slug={goLinks.whatsappCommercial}
              className="inline-flex w-fit items-center border border-chalk bg-ink/70 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-chalk backdrop-blur-sm transition-colors hover:bg-chalk hover:text-ink"
            >
              Quiero hablar con Cristian
            </GoLink>
            </div>
          </PageHero>
        </div>
      </div>
      {/* Contacto directo — Cristian's own request, 2026-08-28: the
          page only had a WhatsApp button (behind a click), not the
          actual email/phone visible as text. All three now shown
          together, right under the hero. */}
      <section className="border-t border-steel-dim/40 py-10">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Contacto directo</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-steel sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
            <a href="mailto:cristiancamilob88@gmail.com" className="text-chalk transition-colors hover:text-ember">
              cristiancamilob88@gmail.com
            </a>
            <a href="tel:+573026342927" className="text-chalk transition-colors hover:text-ember">
              +57 302 634 2927
            </a>
            <GoLink
              slug={goLinks.whatsappCommercial}
              className="text-chalk underline underline-offset-4 transition-colors hover:text-ember"
            >
              Escríbeme por WhatsApp
            </GoLink>
          </div>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Para quién</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {audiences.map((audience) => (
              <span
                key={audience}
                className="border border-steel-dim/50 px-4 py-2 text-sm text-steel"
              >
                {audience}
              </span>
            ))}
          </div>
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">Formatos de partida</p>
          <div className="mt-6 grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.name} className="bg-ink p-6">
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-chalk">
                  {pkg.name}
                </h3>
                <p className="mt-2 text-sm text-steel">{pkg.detail}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="border-t border-steel-dim/40 py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-dim">En acción</p>
          <div className="mt-6 grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-3">
            {actionPhotos.map((photo) => (
              <div key={photo.src} className="relative aspect-[3/4] bg-ink">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
