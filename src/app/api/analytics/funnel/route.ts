import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { computeFunnel, PRESET_FUNNELS, type FunnelStep } from "@/server/analytics/funnel";
import { INTERACTION_EVENT_NAMES } from "@/server/db/repositories/interaction";

const VALID_EVENTS = new Set<string>([...INTERACTION_EVENT_NAMES, "visit"]);

/**
 * Private. `?preset=acquisition-to-purchase` (default) or
 * `?steps=visit,landing_view,cta_click,lead_submitted` for a custom
 * funnel — the calculator itself never changes, only the step list
 * (docs/ANALYTICS_ENGINE.md, "Funnels").
 */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const { searchParams } = request.nextUrl;
  let steps: FunnelStep[];

  const customSteps = searchParams.get("steps");
  if (customSteps) {
    const eventNames = customSteps.split(",").map((s) => s.trim());
    const invalid = eventNames.find((name) => !VALID_EVENTS.has(name));
    if (invalid) {
      return NextResponse.json({ ok: false, error: `Unknown funnel step "${invalid}".` }, { status: 400 });
    }
    steps = eventNames.map((name) => ({ name, event: name as FunnelStep["event"] }));
  } else {
    const presetName = searchParams.get("preset") ?? "acquisition-to-purchase";
    const preset = PRESET_FUNNELS[presetName];
    if (!preset) {
      return NextResponse.json(
        { ok: false, error: `Unknown preset "${presetName}". Known: ${Object.keys(PRESET_FUNNELS).join(", ")}` },
        { status: 400 },
      );
    }
    steps = preset;
  }

  const result = await computeFunnel(getPool(), steps, resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data: result });
}
