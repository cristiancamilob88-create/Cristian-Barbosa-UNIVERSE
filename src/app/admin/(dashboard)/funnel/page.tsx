import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { FunnelPageContent } from "./FunnelPageContent";

export const metadata: Metadata = { title: "Embudo" };

export default function AdminFunnelPage() {
  return (
    <>
      <SectionHeader
        tag="Embudo"
        title="Visitantes → Landing → CTA → Registro → Compra"
        description="Volumen y conversión entre cada paso — infraestructura reutilizable para embudos futuros por pilar (entrenamiento, música, shows, productos, comunidad)."
      />
      <FunnelPageContent />
    </>
  );
}
