import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { FunnelPageContent } from "./FunnelPageContent";

export const metadata: Metadata = { title: "Funnel" };

export default function AdminFunnelPage() {
  return (
    <>
      <SectionHeader
        tag="Funnel"
        title="Visitors → Landing → CTA → Lead → Purchase"
        description="Volumen y conversión entre cada paso — infraestructura reutilizable para funnels futuros por pilar (entrenamiento, música, shows, productos, comunidad)."
      />
      <FunnelPageContent />
    </>
  );
}
