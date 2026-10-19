"use client";

/**
 * Analytics event taxonomy + a pluggable client-side tracking abstraction.
 *
 * Decision: page components never call a vendor SDK directly. They call
 * `track(...)` from this module. Two sinks are wired today:
 *  - `console.debug` in development only.
 *  - a POST to /api/track for the subset of events worth persisting from
 *    the client (PERSISTED_CLIENT_EVENTS below) — everything else here is
 *    reserved for when a real commerce/vendor integration lands.
 *
 * `whatsapp_click`/`social_click`/`outbound_click` are deliberately NOT
 * client events: those go through `/go/<slug>` (components/ui/GoLink.tsx),
 * which records them server-side — see docs/SOCIAL_ROUTING.md.
 * `lead_submit` fires here for a future vendor pixel but is NOT forwarded
 * to /api/track, because /api/lead already records `lead_submitted`
 * server-side in the same request that creates the lead — forwarding it
 * here would double-count.
 *
 * `page_view`/`landing_view` were deferred in Block 02 as "better served
 * by a real analytics warehouse later" — Block 03 IS that later: the
 * measurement engine needs real page-level volume to answer "which
 * pillar gets discovered" and "landing → lead" at all. Persisted via
 * PageViewTracker (src/components/analytics/PageViewTracker.tsx), not
 * fired ad hoc from page components.
 *
 * See docs/ANALYTICS_ENGINE.md for the full event-by-event rationale.
 */

export type AnalyticsEvent =
  | { name: "page_view"; path: string }
  | { name: "landing_view"; path: string }
  | { name: "cta_click"; cta: string; topic: string }
  | { name: "map_interaction"; action: MapAction; town: string; query?: string; found?: boolean }
  | { name: "lead_submit"; topic: string }
  | { name: "checkout_start"; productId: string }
  | { name: "purchase"; productId: string; amountCents: number }
  | { name: "subscription_start"; productId: string };

/**
 * What the visitor did on the tour map (Cristian, 2026-10-19: "¿qué
 * pueblo buscaron o qué pin tocaron?"): typed a town in its search box,
 * tapped a pin, tapped a town in its list, or typed one in the
 * homepage's "¿Ya estuvo en tu pueblo?" box.
 */
export type MapAction = "search" | "pin" | "list" | "town_check";

export type AnalyticsSink = (event: AnalyticsEvent) => void;

/** Client events that also get persisted server-side, verbatim by name, via /api/track. */
const PERSISTED_CLIENT_EVENTS = new Set<AnalyticsEvent["name"]>(["cta_click", "page_view", "landing_view", "map_interaction"]);

const sinks: AnalyticsSink[] = [];

if (process.env.NODE_ENV !== "production") {
  sinks.push((event) => {
    console.debug("[analytics]", event);
  });
}

sinks.push((event) => {
  if (!PERSISTED_CLIENT_EVENTS.has(event.name)) return;

  let metadata: Record<string, string | boolean> = {};
  if (event.name === "cta_click") metadata = { cta: event.cta, topic: event.topic };
  if (event.name === "map_interaction") {
    metadata = { action: event.action, town: event.town };
    if (event.query !== undefined) metadata.query = event.query;
    if (event.found !== undefined) metadata.found = event.found;
  }

  // keepalive: the click/navigation that triggers this often immediately
  // moves the page along (an internal Link, a new-tab external CTA) —
  // keepalive lets the browser finish sending the request after the page
  // starts unloading/navigating.
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName: event.name,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      metadata,
    }),
  }).catch(() => {
    // Analytics delivery is best-effort — never surface this to the user.
  });
});

/** Register an additional sink (e.g. a vendor SDK adapter) at app startup. */
export function registerAnalyticsSink(sink: AnalyticsSink): void {
  sinks.push(sink);
}

export function track(event: AnalyticsEvent): void {
  for (const sink of sinks) sink(event);
}
