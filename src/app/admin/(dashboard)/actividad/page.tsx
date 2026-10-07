import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { ActividadPageContent } from "./ActividadPageContent";

export const metadata: Metadata = { title: "Actividad" };

/**
 * "Actividad de hoy" (2026-10-07) — the day's visitors one by one, each
 * with where they came from and every page/button they touched, in
 * plain Spanish. Reads /api/analytics/activity (src/server/analytics/
 * activity.ts). Uses its own Colombian-day picker instead of the shared
 * DateRangeControl: that control's "Hoy" starts at midnight UTC (7 p. m.
 * in Colombia) — see bogotaDayRange() in src/lib/adminActivity.ts.
 */
export default function AdminActividadPage() {
  return (
    <>
      <SectionHeader
        tag="Actividad"
        title="Actividad del día"
        description="Cada persona que entró, de dónde vino y qué tocó, en orden. Las personas aparecen como «Visitante 1, 2, 3…» según la hora en que llegaron: el sitio no guarda nombres de quien solo mira."
        hideDateRange
      />
      <ActividadPageContent />
    </>
  );
}
