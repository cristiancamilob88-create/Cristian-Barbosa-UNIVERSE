import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { LandingsPageContent } from "./LandingsPageContent";

export const metadata: Metadata = { title: "Landings" };

/**
 * Section 5 — Landing performance (FASE 4). One row per `route` value
 * actually seen in `interaction` — works for every current pillar route
 * and any future one automatically, nothing here lists `/entrenar`,
 * `/musica`, etc. by name (docs/COMMAND_CENTER.md, "Routes are never
 * hardcoded"). Kept as a Server Component only for `metadata` — see
 * OverviewPageContent.tsx's doc comment for why the content itself
 * moved to a Client Component.
 */
export default function AdminLandingsPage() {
  return (
    <>
      <SectionHeader
        tag="Landings"
        title="Rendimiento por ruta"
        description="Views, visitantes únicos, tiempo promedio en la página, CTA clicks y conversión a lead/compra — atribuido a la primera ruta en la que entró cada contacto."
      />
      <LandingsPageContent />
    </>
  );
}
