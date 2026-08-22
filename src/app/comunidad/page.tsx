import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Comunidad",
  description:
    "Únete a la comunidad gratuita en WhatsApp o entra a Entrena con Cristian Barbosa, la experiencia de entrenamiento semanal.",
  path: "/comunidad",
});

export default function ComunidadPage() {
  return (
    <>
      <PageHero
        tag="COMMUNITY"
        title="Comunidad"
        description="Dos formas de estar cerca: la comunidad gratuita en WhatsApp, o Entrena con Cristian Barbosa — la experiencia semanal."
      />
      <section className="py-16">
        <Container className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
          <div className="flex flex-col justify-between gap-6 bg-ink p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ember">Gratis</p>
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
              Unirme por WhatsApp
            </GoLink>
          </div>

          <div className="flex flex-col justify-between gap-6 bg-ink p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ember">Experiencia</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Entrena con Cristian Barbosa
              </h2>
              <p className="mt-3 text-sm text-steel">
                Entrenamiento semanal, contenido exclusivo, lives, retos y comunidad activa —
                por Facebook Subscription.
              </p>
            </div>
            <GoLink
              slug={goLinks.facebookSubscription}
              className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
            >
              Ver en Facebook
            </GoLink>
          </div>
        </Container>
      </section>
    </>
  );
}
