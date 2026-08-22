import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";
import type { InteractionEventName } from "@/server/db/repositories/interaction";

/**
 * A funnel step is either the special "visit" (any interaction at all —
 * the top of every funnel) or a taxonomy event name. Defining a new
 * funnel is just a different array of steps passed to computeFunnel —
 * "el sistema debe permitir crear estos funnels posteriormente sin
 * modificar la arquitectura fundamental" (docs/ANALYTICS_ENGINE.md,
 * "Funnels").
 */
export interface FunnelStep {
  name: string;
  event: InteractionEventName | "visit";
}

export interface FunnelStepResult {
  name: string;
  event: string;
  visitors: number;
  conversionFromPrevious: number | null;
  conversionFromFirst: number | null;
}

/**
 * Each step's count is the number of DISTINCT visitors who reached that
 * step AND every step before it (a classic funnel, computed as a
 * shrinking set intersection in application code — not strict in-session
 * ordering; "reached" means "has at least one such event in range").
 * Simple, correct at this traffic scale, and easy to reason about;
 * revisit with a single SQL pass (window functions / INTERSECT) only if
 * profiling ever shows this is a bottleneck.
 */
export async function computeFunnel(
  db: Pool | PoolClient,
  steps: FunnelStep[],
  range: ResolvedDateRange,
): Promise<FunnelStepResult[]> {
  if (steps.length === 0) return [];

  // Sequential, not Promise.all: `db` may be a single PoolClient (one
  // Postgres connection), which cannot run overlapping queries safely —
  // see the same fix and rationale in reference.ts's resolveTouch().
  const stepVisitorSets: Set<string>[] = [];
  for (const step of steps) {
    stepVisitorSets.push(await getStepVisitorIds(db, step, range));
  }

  const results: FunnelStepResult[] = [];
  let carry: Set<string> | null = null;
  let firstCount = 0;

  for (let i = 0; i < steps.length; i++) {
    const stepSet = stepVisitorSets[i];
    carry = carry === null ? stepSet : intersect(carry, stepSet);
    if (i === 0) firstCount = carry.size;

    results.push({
      name: steps[i].name,
      event: steps[i].event,
      visitors: carry.size,
      conversionFromPrevious: i === 0 ? null : results[i - 1].visitors > 0 ? carry.size / results[i - 1].visitors : 0,
      conversionFromFirst: firstCount > 0 ? carry.size / firstCount : null,
    });
  }

  return results;
}

async function getStepVisitorIds(
  db: Pool | PoolClient,
  step: FunnelStep,
  range: ResolvedDateRange,
): Promise<Set<string>> {
  const params = [range.from.toISOString(), range.to.toISOString()];
  const query =
    step.event === "visit"
      ? "select distinct visitor_id from interaction where created_at between $1 and $2"
      : "select distinct visitor_id from interaction where event_name = $3 and created_at between $1 and $2";

  const { rows } = await db.query<{ visitor_id: string }>(
    query,
    step.event === "visit" ? params : [...params, step.event],
  );
  return new Set(rows.map((r) => r.visitor_id));
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const item of a) {
    if (b.has(item)) result.add(item);
  }
  return result;
}

/** Two funnels named directly in the brief's own examples — ready to call, not the only ones possible. */
export const PRESET_FUNNELS: Record<string, FunnelStep[]> = {
  "acquisition-to-purchase": [
    { name: "Visit", event: "visit" },
    { name: "Landing view", event: "landing_view" },
    { name: "CTA click", event: "cta_click" },
    { name: "Lead", event: "lead_submitted" },
    { name: "Checkout started", event: "checkout_started" },
    { name: "Purchase", event: "purchase" },
  ],
  "training-to-lead": [
    { name: "Visit", event: "visit" },
    { name: "CTA click", event: "cta_click" },
    { name: "WhatsApp click", event: "whatsapp_click" },
    { name: "Lead", event: "lead_submitted" },
  ],
};
