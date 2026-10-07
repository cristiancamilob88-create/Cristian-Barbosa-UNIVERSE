import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { CheckoutLink } from "@/components/ui/CheckoutLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Servicios — shows, sesiones 1:1, coaching y marcas",
  description:
    "Todo lo que ofrece Cristian Barbosa en un solo lugar: shows en vivo de calistenia en Antioquia, sesión 1:1 de 70 min por $80.000, coaching, suscripción y alianzas con marcas.",
  path: "/servicios",
});

/**
 * Every offer on one page (Cristian's ask, 2026-10-03: "servicios").
 * Prices are only the real ones already live elsewhere on the site
 * (offer rows in the database); anything quoted case by case says so.
 * Each card hands off to the page or checkout that actually sells it —
 * this page sells nothing on its own.
 */
type Action =
  | { kind: "checkout"; offerSlug: string; label: string }
  | { kind: "link"; href: string; label: string; cta: string }
  | { kind: "whatsapp"; label: string };

interface Service {
  tag: string;
  title: string;
  price: string;
  detail: string;
  primary: Action;
  secondary?: Action;
  featured?: boolean;
}

const services: Service[] = [
  {
    tag: "Shows",
    title: "Shows en vivo",
    price: "Cotización según el evento",
    detail:
      "Calistenia extrema, paradas de manos, fuego y expresión corporal. Para municipios, colegios, empresas, ferias, festivales y eventos privados en Medellín y toda Antioquia. Más de 20 municipios recorridos con el Circo Santiago de Chile.",
    primary: { kind: "link", href: "/contacto?topic=shows", label: "Cotizar un show", cta: "intent_shows" },
    secondary: { kind: "link", href: "/shows", label: "Ver shows", cta: "intent_shows" },
    featured: true,
  },
  {
    tag: "Entrena",
    title: "Sesión 1:1",
    price: `${formatCents(8_000_000)} · 70 min`,
    detail: "Una sesión de calistenia directamente con Cristian, a tu nivel. Reservas y pagas en línea; el día, la hora y el lugar se coordinan por WhatsApp.",
    primary: { kind: "checkout", offerSlug: "sesion-1a1-70min", label: "Reservar mi sesión" },
    featured: true,
  },
  {
    tag: "Coaching",
    title: "Coaching personalizado",
    price: `Desde ${formatCents(110_000_000)}`,
    detail: "Programación, seguimiento y contacto directo con Cristian. Tres niveles: Essential, Performance y Elite. Se acuerda por WhatsApp.",
    primary: { kind: "link", href: "/entrenar#coaching", label: "Ver niveles", cta: "intent_coaching" },
    secondary: { kind: "whatsapp", label: "Escribir por WhatsApp" },
  },
  {
    tag: "Suscripción",
    title: "Entrena con Cristian Barbosa",
    price: `${formatCents(2_990_000)} / mes`,
    detail: "Entrenamiento semanal, contenido exclusivo, lives y retos por Facebook Subscription.",
    primary: { kind: "checkout", offerSlug: "facebook-subscription-standard", label: "Suscribirme" },
  },
  {
    tag: "Marcas",
    title: "Alianzas y patrocinios",
    price: "Según el formato",
    detail:
      "Embajador de Expofitness y Club Nativos. Patrocinios, contenido, activaciones y presencia en sus shows por Antioquia.",
    primary: { kind: "link", href: "/contacto?topic=marcas", label: "Trabajar con Cristian", cta: "intent_brands" },
    secondary: { kind: "link", href: "/marcas", label: "Ver marcas", cta: "intent_brands" },
  },
  {
    tag: "Comunidad",
    title: "Comunidad gratuita",
    price: "Gratis",
    detail: "El punto de entrada: retos, novedades y conexión por WhatsApp.",
    primary: { kind: "link", href: "/comunidad", label: "Entrar a la comunidad", cta: "intent_community" },
  },
];

const primaryClass =
  "inline-flex w-fit items-center bg-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk";
const secondaryClass = "text-sm text-steel underline underline-offset-4 hover:text-chalk";

function ActionLink({ action, className }: { action: Action; className: string }) {
  if (action.kind === "checkout") {
    return (
      <CheckoutLink offerSlug={action.offerSlug} className={className}>
        {action.label}
      </CheckoutLink>
    );
  }
  if (action.kind === "whatsapp") {
    return (
      <GoLink slug={goLinks.whatsappCommercial} className={className}>
        {action.label}
      </GoLink>
    );
  }
  return (
    <TrackedLink event={{ name: "cta_click", cta: action.cta, topic: "servicios" }} href={action.href} className={className}>
      {action.label}
    </TrackedLink>
  );
}

export default function ServiciosPage() {
  return (
    <>
      <PageHero
        tag="SERVICIOS"
        title="Servicios"
        description="Shows, entrenamiento, coaching y alianzas — todo lo que puedes hacer con Cristian Barbosa, en un solo lugar."
      />
      <section className="py-16">
        <Container className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.title}
              className={`flex flex-col gap-4 border p-8 ${service.featured ? "border-ember/60 bg-ink-raised" : "border-steel-dim/40 bg-ink"}`}
            >
              <p className="font-mono text-xs uppercase tracking-widest text-ember">{service.tag}</p>
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-chalk">{service.title}</h2>
              <p className="font-mono text-sm text-chalk">{service.price}</p>
              <p className="text-sm leading-relaxed text-steel">{service.detail}</p>
              <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
                <ActionLink action={service.primary} className={primaryClass} />
                {service.secondary && <ActionLink action={service.secondary} className={secondaryClass} />}
              </div>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
