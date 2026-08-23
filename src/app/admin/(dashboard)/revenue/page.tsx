import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { RevenuePageContent } from "./RevenuePageContent";

export const metadata: Metadata = { title: "Revenue" };

/**
 * Section 9 — Revenue (FASE 4). First-touch/last-touch only, per
 * docs/ANALYTICS_ENGINE.md's explicit "no multi-touch in this block"
 * decision — the toggle below switches which of those two the API
 * computes, nothing else.
 */
export default function AdminRevenuePage() {
  return (
    <>
      <SectionHeader
        tag="Revenue"
        title="Ingresos"
        description="Total, por fuente, campaña, QR y producto/oferta — first-touch o last-touch attribution."
      />
      <RevenuePageContent />
    </>
  );
}
