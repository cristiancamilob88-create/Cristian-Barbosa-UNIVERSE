import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { OverviewPageContent } from "./OverviewPageContent";

export const metadata: Metadata = { title: "Overview" };

/**
 * Section 1 — Overview (FASE 4, refined in Block 04.1). Kept as a Server
 * Component only for `metadata` — everything data-dependent lives in
 * `OverviewPageContent` (Client Component; see its own doc comment for
 * why this split exists, added 2026-08-25 after `next start` surfaced
 * "Functions cannot be passed directly to Client Components" here:
 * `AnalyticsBoundary`'s render-prop `children` can't cross the Server →
 * Client boundary as a function).
 */
export default function AdminOverviewPage() {
  return (
    <>
      <SectionHeader
        tag="Command Center"
        title="Overview"
        description="Tráfico, conversión y revenue del rango seleccionado — definiciones exactas en docs/KPI_DEFINITIONS.md."
      />
      <OverviewPageContent />
    </>
  );
}
