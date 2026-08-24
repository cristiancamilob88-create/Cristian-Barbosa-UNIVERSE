import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { goLinks } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Productos",
  description: "Productos físicos y digitales de Cristian Barbosa.",
  path: "/productos",
});

export default function ProductosPage() {
  return (
    <>
      <PageHero
        tag="SHOP"
        title="Productos"
        description="Dos catálogos, un mismo estándar: lo físico para entrenar y vestir, lo digital para aprender."
      />
      <section className="py-16">
        <Container className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
          <div className="flex flex-col justify-between gap-6 bg-ink p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ember">Físicos</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Ropa y accesorios
              </h2>
              <p className="mt-3 text-sm text-steel">
                Ecommerce propio y productos de terceros seleccionados — fitness y lifestyle.
                Por ahora, cuéntanos qué buscas y coordinamos por WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <TrackedLink
                event={{ name: "cta_click", cta: "intent_products_physical", topic: "productos" }}
                href="/contacto?topic=productos_fisicos"
                className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
              >
                Quiero ver los productos
              </TrackedLink>
              <GoLink
                slug={goLinks.whatsappCommercial}
                className="inline-flex w-fit items-center border border-steel-dim/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:border-chalk"
              >
                Escribir por WhatsApp
              </GoLink>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 bg-ink p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ember">Digitales</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Cursos e infoproductos
              </h2>
              <p className="mt-3 text-sm text-steel">
                El método de Cristian, disponible para aprender a tu propio ritmo — programas
                cortos, guías y contenido descargable.
              </p>
            </div>
            <TrackedLink
              event={{ name: "cta_click", cta: "intent_training_course", topic: "productos" }}
              href="/contacto?topic=productos_digitales"
              className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
            >
              Quiero aprender calistenia
            </TrackedLink>
          </div>
        </Container>
      </section>
    </>
  );
}
