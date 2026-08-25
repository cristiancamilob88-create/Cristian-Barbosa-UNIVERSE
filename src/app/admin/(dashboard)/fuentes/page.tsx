import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { FuentesPageContent } from "./FuentesPageContent";

export const metadata: Metadata = { title: "Fuentes" };

/**
 * Section 2 — Adquisición (FASE 4, extended in Block 04.1): de dónde
 * viene la audiencia, por source, campaign, y (Block 04.1) medium —
 * `getPerformanceByDimension()` (src/server/analytics/performance.ts)
 * is already source-extensible (a new platform is a `source` dictionary
 * row, never new code — see docs/COMMAND_CENTER.md, "Adding a new
 * source"), and now covers `medium` too (a free-text dimension, not a
 * dictionary table — same function, no join). Kept as a Server
 * Component only for `metadata` — see OverviewPageContent.tsx's doc
 * comment for why the content itself moved to a Client Component.
 */
export default function AdminFuentesPage() {
  return (
    <>
      <SectionHeader
        tag="Adquisición"
        title="Fuentes, campañas y medium"
        description="¿De dónde viene la audiencia? Instagram, Facebook, TikTok, YouTube, WhatsApp, Google, eventos, QR, referidos — qué campaña y qué medium específico."
      />
      <FuentesPageContent />
    </>
  );
}
