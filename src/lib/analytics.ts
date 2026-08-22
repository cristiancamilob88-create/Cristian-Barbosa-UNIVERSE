"use client";

/**
 * Analytics event taxonomy + a pluggable client-side tracking abstraction.
 *
 * Decision: page components never call a vendor SDK directly. They call
 * `track(...)` from this module. Two sinks are wired today:
 *  - `console.debug` in development only.
 *  - a POST to /api/track for the subset of events worth persisting from
 *    the client (see PERSISTED_EVENTS below) — everything else here is
 *    reserved for when a real commerce/vendor integration lands.
 *
 * `whatsapp_click`/`social_click` are deliberately NOT client events: those
 * go through `/go/<slug>` (components/ui/GoLink.tsx), which records them
 * server-side — see docs/SOCIAL_ROUTING.md. `lead_submit` fires here for
 * a future vendor pixel but is NOT forwarded to /api/track, because
 * /api/lead already records `lead_submitted` server-side in the same
 * request that creates the lead — forwarding it here would double-count.
 *
 * See docs/ANALYTICS.md for the full event-by-event rationale.
 */

export type AnalyticsEvent =
  | { name: "page_view"; path: string }
  | { name: "cta_click"; cta: string; topic: string }
  | { name: "lead_submit"; topic: string }
  | { name: "checkout_start"; productId: string }
  | { name: "purchase"; productId: string; amountCents: number }
  | { name: "subscription_start"; productId: string };

export type AnalyticsSink = (event: AnalyticsEvent) => void;

const sinks: AnalyticsSink[] = [];

if (process.env.NODE_ENV !== "production") {
  sinks.push((event) => {
    console.debug("[analytics]", event);
  });
}

sinks.push((event) => {
  if (event.name !== "cta_click") return;
  // keepalive: the click that triggers this often immediately navigates
  // away (an internal Link, or a new-tab external CTA) — keepalive lets
  // the browser finish sending the request after the page starts unloading.
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName: "cta_click",
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      metadata: { cta: event.cta, topic: event.topic },
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
