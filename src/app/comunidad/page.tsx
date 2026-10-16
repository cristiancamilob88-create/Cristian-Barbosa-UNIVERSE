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
        tag="COMUNIDAD"
        image={{ src: "/brand/show-fan-lift-01.jpg", alt: "Cristian Barbosa en un evento fitness", position: "object-[50%_30%]" }}
        title="Comunidad"
        description="Tres formas de estar cerca — la comunidad gratuita en WhatsApp e Instagram, o Entrena con Cristian Barbosa, la suscripción semanal."
      />
      <section className="py-16">
        <Container className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col justify-between gap-6 bg-ink-raised p-8">
            <div>
              <p className="text-base text-ember">Gratis · WhatsApp</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Comunidad WhatsApp
              </h2>
              <p className="mt-3 text-base text-steel">
                Conexión directa, noticias, retos y conversación. La puerta de entrada al
                universo.
              </p>
            </div>
            <GoLink
              slug={goLinks.whatsappCommunity}
              className="inline-flex w-fit items-center px-5 py-2.5 text-base font-bold text-ink transition-colors bg-ember hover:bg-chalk focus-visible:bg-chalk"
            >
              Quiero entrar a la comunidad
            </GoLink>
          </div>

          <div className="flex flex-col justify-between gap-6 bg-ink-raised p-8">
            <div>
              <p className="text-base text-ember">Gratis · Instagram</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Instagram Comunidad
              </h2>
              <p className="mt-3 text-base text-steel">
                La cuenta de comunidad de Cristian — contenido, retos y conversación pública,
                aparte de su cuenta principal.
              </p>
            </div>
            <GoLink
              slug={goLinks.instagramCommunity}
              className="inline-flex w-fit items-center px-5 py-2.5 text-base font-bold text-ink transition-colors bg-chalk hover:bg-ember focus-visible:bg-ember"
            >
              Seguir en Instagram
            </GoLink>
          </div>

          <div className="flex flex-col justify-between gap-6 bg-ink-raised p-8">
            <div>
              <p className="text-base text-ember">Suscripción</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Entrena con Cristian Barbosa
              </h2>
              <p className="mt-3 text-base text-steel">
                Entrenamiento semanal, contenido exclusivo, lives, retos y comunidad activa —
                por Facebook Subscription.
              </p>
              <p className="mt-3 text-base uppercase tracking-widest text-chalk">
                {formatCents(2_990_000)} <span className="text-steel-dim">/ mes</span>
              </p>
            </div>
            <CheckoutLink
              offerSlug="facebook-subscription-standard"
              className="inline-flex w-fit items-center px-5 py-2.5 text-base font-bold text-ink transition-colors bg-chalk hover:bg-ember focus-visible:bg-ember"
            >
              Suscribirme por Facebook
            </CheckoutLink>
          </div>
        </Container>
      </section>
    </>
  );
}
