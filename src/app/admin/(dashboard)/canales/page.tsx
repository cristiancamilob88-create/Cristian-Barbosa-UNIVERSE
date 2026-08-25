import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { CanalesPageContent } from "./CanalesPageContent";

export const metadata: Metadata = { title: "Canales" };

/**
 * FASE 10 — Comparación de canales. Reuses GET /api/analytics/sources
 * (`source` IS the channel dimension — Instagram/Facebook/TikTok/
 * YouTube/WhatsApp/Google/Evento/QR/Referral/Direct, all rows of the
 * same `source` dictionary table, extensible without touching this
 * page) instead of a new "channel" read model.
 *
 * What's NOT here, on purpose: sessions/landing-views/CTA-clicks broken
 * down BY channel aren't a read model Block 03 built (only
 * visitors/leads/purchases/revenue are, per dimension) — adding one
 * would mean a new query, which the brief's "no duplicar read models"
 * rules out for this block. And no CAC/ROAS/CPA/CPL: no real ad-spend
 * data exists to compute them from yet (docs/KPI_DEFINITIONS.md,
 * "What's deliberately not defined yet") — this table is exactly where
 * those columns will attach once a real ad platform is connected.
 *
 * Kept as a Server Component only for `metadata` — see
 * OverviewPageContent.tsx's doc comment for why the content itself
 * moved to a Client Component.
 */
export default function AdminCanalesPage() {
  return (
    <>
      <SectionHeader
        tag="Comparación"
        title="Canales"
        description="Instagram, Facebook, TikTok, YouTube, WhatsApp, eventos, QR, campañas pagadas — lado a lado. Sin CAC/ROAS todavía: no hay gasto publicitario real conectado."
      />
      <CanalesPageContent />
    </>
  );
}
