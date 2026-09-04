import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { CampanasPageContent } from "./CampanasPageContent";

export const metadata: Metadata = { title: "Campañas" };

/**
 * Every registered `campaign`, general performance table (visits →
 * landing views → CTA/WhatsApp clicks → leads → purchases → revenue).
 * Added 2026-08-28 (Cristian's own ask, after Concordia): this is the
 * "general" view; each row links into `/admin/campanas/[slug]` for the
 * "específica" one-campaign view.
 */
export default function AdminCampanasPage() {
  return (
    <>
      <SectionHeader
        tag="Por campaña"
        title="Campañas"
        description="Aura, shows, colegios, Concordia — cada campaña registrada, de visita a compra. Haz clic en una para ver su detalle."
      />
      <CampanasPageContent />
    </>
  );
}
