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
        tag="PRODUCTOS"
        image={{ src: "/brand/cristian-hero-02.jpg", alt: "Cristian Barbosa en la montaña", position: "object-[50%_30%]" }}
        title="Productos"
        description="Dos catálogos, un mismo estándar: lo físico para entrenar y vestir, lo digital para aprender."
      />
      <section className="py-16">
        <Container className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col justify-between gap-6 bg-ink-raised p-8">
            <div>
              <p className="text-base text-ember">Físicos</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Ropa y accesorios
              </h2>
              <p className="mt-3 text-base text-steel">
                Ecommerce propio y productos de terceros seleccionados — fitness y lifestyle.
                Por ahora, cuéntanos qué buscas y coordinamos por WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <TrackedLink
                event={{ name: "cta_click", cta: "intent_products_physical", topic: "productos" }}
                href="/contacto?topic=productos_fisicos"
                className="inline-flex w-fit items-center px-5 py-2.5 text-base font-bold text-ink transition-colors bg-ember hover:bg-chalk focus-visible:bg-chalk"
              >
                Quiero ver los productos
              </TrackedLink>
              <GoLink
                slug={goLinks.whatsappCommercial}
                className="inline-flex w-fit items-center px-5 py-2.5 text-base font-bold text-ink transition-colors bg-chalk hover:bg-ember focus-visible:bg-ember"
              >
                Escribir por WhatsApp
              </GoLink>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 bg-ink-raised p-8">
            <div>
              <p className="text-base text-ember">Digitales</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
                Cursos e infoproductos
              </h2>
              <p className="mt-3 text-base text-steel">
                El método de Cristian, disponible para aprender a tu propio ritmo — programas
                cortos, guías y contenido descargable.
              </p>
            </div>
            <TrackedLink
              event={{ name: "cta_click", cta: "intent_training_course", topic: "productos" }}
              href="/contacto?topic=productos_digitales"
              className="inline-flex w-fit items-center px-5 py-2.5 text-base font-bold text-ink transition-colors bg-chalk hover:bg-ember focus-visible:bg-ember"
            >
              Quiero aprender calistenia
            </TrackedLink>
          </div>
        </Container>
      </section>
    </>
  );
}
