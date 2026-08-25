import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { ContactosPageContent } from "./ContactosPageContent";

export const metadata: Metadata = { title: "Contactos" };

/**
 * Cristian's own request, 2026-08-25: "quiero ver esa base de datos de
 * esas personas" — real name/email/teléfono per registro, so he can
 * actually reach out, not just count. Deliberately separate from
 * /admin/leads (which stays PII-free, per docs/ANALYTICS_ENGINE.md) —
 * see src/server/admin/contacts.ts's doc comment for the full
 * architecture reasoning. Kept as a Server Component only for
 * `metadata` — see OverviewPageContent.tsx's doc comment for why the
 * content itself moved to a Client Component.
 */
export default function AdminContactosPage() {
  return (
    <>
      <SectionHeader
        tag="CRM"
        title="Contactos"
        description="Nombre, email, teléfono y mensaje de cada persona registrada — para hacer seguimiento real, no solo contar. Los últimos 100 registros, sin filtro de fecha."
        hideDateRange
      />
      <ContactosPageContent />
    </>
  );
}
