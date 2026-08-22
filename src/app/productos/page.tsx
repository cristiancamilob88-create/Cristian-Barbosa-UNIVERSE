import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { buildMetadata } from "@/lib/seo";

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
          <div className="bg-ink p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-ember">Físicos</p>
            <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
              Ropa y accesorios
            </h2>
            <p className="mt-3 text-sm text-steel">
              Ecommerce propio y productos de terceros seleccionados — fitness y lifestyle.
            </p>
          </div>
          <div className="bg-ink p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-ember">Digitales</p>
            <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-chalk">
              Cursos e infoproductos
            </h2>
            <p className="mt-3 text-sm text-steel">
              El método de Cristian, disponible para aprender a tu propio ritmo.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
