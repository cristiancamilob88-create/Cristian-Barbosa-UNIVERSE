import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { NegociosPageContent } from "./NegociosPageContent";

export const metadata: Metadata = { title: "Negocios" };

/**
 * Cristian's own request, 2026-09-13 ("Ruta de Capitalización"): every
 * "Shows"/"Marcas" submission on /contacto has had a real writer since
 * Block 07 (`b2b_opportunity`, `stage` tracking) — but nowhere in
 * /admin to see it. Same architecture as /admin/contactos (real PII,
 * its own module/endpoint/DTO file, no date range — see
 * src/server/admin/opportunities.ts's doc comment and
 * docs/COMMAND_CENTER.md §19).
 */
export default function AdminNegociosPage() {
  return (
    <>
      <SectionHeader
        tag="B2B"
        title="Negocios"
        description="Cada solicitud real de shows, marcas o patrocinios — con quién, en qué etapa, y qué valor estimado — para hacerle seguimiento. Los últimos 100 registros, sin filtro de fecha."
        hideDateRange
      />
      <NegociosPageContent />
    </>
  );
}
