import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GoLink } from "@/components/ui/GoLink";
import { CheckoutLink } from "@/components/ui/CheckoutLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Comunidad de calistenia",
  description:
    "Tres formas de estar cerca de Cristian Barbosa: WhatsApp gratuito, Instagram Comunidad, o Entrena con Cristian Barbosa (Facebook Subscription).",
  path: "/comunidad",
});

export default function ComunidadPage() {
  return (
    <>
      <PageHero
        tag="COMMUNITY"
        title="Comunidad"
        description="Tres formas de estar cerca — la comunidad gratuita en WhatsApp e Instagram, o Entrena con Cristian Barbosa, la suscripción semanal."
      />
      <section className="py-16">
        <Container className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-3">
          <div className="flex flex-col justify-between gap-6 bg-ink p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ember">Gratis · WhatsApp</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Comunidad WhatsApp
              </h2>
              <p className="mt-3 text-sm text-steel">
                Conexión directa, noticias, retos y conversación. La puerta de entrada al
                universo.
              </p>
            </div>
            <GoLink
              slug={goLinks.whatsappCommunity}
              className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
            >
              Quiero entrar a la comunidad
            </GoLink>
          </div>

          <div className="flex flex-col justify-between gap-6 bg-ink p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ember">Gratis · Instagram</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Instagram Comunidad
              </h2>
              <p className="mt-3 text-sm text-steel">
                La cuenta de comunidad de Cristian — contenido, retos y conversación pública,
                aparte de su cuenta principal.
              </p>
            </div>
            <GoLink
              slug={goLinks.instagramCommunity}
              className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
            >
              Seguir en Instagram
            </GoLink>
          </div>

          <div className="flex flex-col justify-between gap-6 bg-ink p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ember">Suscripción</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Entrena con Cristian Barbosa
              </h2>
              <p className="mt-3 text-sm text-steel">
                Entrenamiento semanal, contenido exclusivo, lives, retos y comunidad activa —
                por Facebook Subscription.
              </p>
              <p className="mt-3 font-mono text-sm uppercase tracking-widest text-chalk">
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
        </Container>
      </section>
    </>
  );
}
