"use client";

import { useState } from "react";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { FunnelBars } from "@/components/admin/FunnelBars";
import { FunnelPresetControl } from "@/components/admin/FunnelPresetControl";
import type { FunnelResponse } from "@/lib/adminAnalytics";

/**
 * Reusable funnel infrastructure (FASE 6): the preset switches which
 * step list GET /api/analytics/funnel computes, but the rendering below
 * (FunnelBars) never changes — a future TRAINING/MUSIC/SHOWS/PRODUCTS/
 * COMMUNITY funnel is a new PRESET_FUNNELS entry (src/server/analytics/funnel.ts)
 * plus one more button here, not a new page.
 */
export function FunnelPageContent() {
  const [preset, setPreset] = useState("acquisition-to-purchase");

  return (
    <div className="flex flex-col gap-6">
      <FunnelPresetControl value={preset} onChange={setPreset} />
      <AnalyticsBoundary<FunnelResponse> path="funnel" extra={{ preset }} isEmpty={(r) => r.data.length === 0}>
        {(res) => <FunnelBars steps={res.data} />}
      </AnalyticsBoundary>
    </div>
  );
}
