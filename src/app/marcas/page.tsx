import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Marcas",
  description: "Partnerships y colaboraciones de marca con Cristian Barbosa.",
  path: "/marcas",
});

export default function MarcasPage() {
  return (
    <PageHero
      tag="BRANDS"
      title="Marcas"
      description="Audiencia real, formatos flexibles de colaboración — desde contenido puntual hasta partnerships de largo plazo."
    >
      <TrackedLink
        event={{ name: "cta_click", cta: "contactar_marca", topic: "marcas" }}
        href="/contacto?topic=marcas"
        className="mt-8 inline-flex w-fit items-center border border-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
      >
        Hablemos de tu marca
      </TrackedLink>
    </PageHero>
  );
}
