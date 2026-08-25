import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { LeadsPageContent } from "./LeadsPageContent";

export const metadata: Metadata = { title: "Registros" };

/**
 * Section 7 — Leads (FASE 4, extended in Block 04.1 with a real
 * activity list): totales, por interés (GET .../overview), por fuente/
 * campaña — reusing the same `sources`/`campaigns` performance endpoints
 * Fuentes uses (each row already carries a `leads` count) — and now
 * (Block 04.1) the individual leads themselves via GET
 * /api/analytics/leads. No PII (no name/email — see getRecentLeads()'s
 * own doc comment); topic/interest/source/campaign/qr/medium/fecha only.
 * Kept as a Server Component only for `metadata` — see
 * OverviewPageContent.tsx's doc comment for why the content itself
 * moved to a Client Component.
 */
export default function AdminLeadsPage() {
  return (
    <>
      <SectionHeader tag="CRM" title="Registros" description="Actividad reciente, totales, por interés, por fuente y por campaña." />
      <LeadsPageContent />
    </>
  );
}
