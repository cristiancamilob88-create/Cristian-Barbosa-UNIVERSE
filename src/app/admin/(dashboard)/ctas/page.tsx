import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { CtasPageContent } from "./CtasPageContent";

export const metadata: Metadata = { title: "CTAs" };

/**
 * CTA breakdown, added 2026-09-09 — see getCtaPerformance()'s doc
 * comment (src/server/analytics/engagement.ts) for why this exists:
 * every other section's "Clics en CTA" is one total across every
 * button on the site; this is that same count broken down by which
 * button (`cta` id) and which page (`route`) it actually happened on.
 */
export default function AdminCtasPage() {
  return (
    <>
      <SectionHeader
        tag="CTAs"
        title="Clics por botón"
        description="Cada clic en CTA, desglosado por el botón exacto y la página donde ocurrió — no solo el total. Varios botones distintos pueden compartir el mismo id a propósito (p. ej. cada 'Ver todo el universo' de una página), así que esto identifica el botón y la página, no la posición exacta dentro de ella."
      />
      <CtasPageContent />
    </>
  );
}
