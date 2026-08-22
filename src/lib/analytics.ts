"use client";

/**
 * Analytics event taxonomy + a pluggable client-side tracking abstraction.
 *
 * Decision: page components never call a vendor SDK directly. They call
 * `track(...)` from this module. Today the only sink is `console.debug`
 * in development (and a no-op in production) so nothing is sent anywhere
 * yet — but every call site is already correct once a real sink (GA4,
 * Meta Pixel, PostHog, a first-party /api/events route, ...) is wired in
 * here, in one place. See docs/ANALYTICS.md for why each event exists.
 */

export type AnalyticsEvent =
  | { name: "page_view"; path: string }
  | { name: "cta_click"; cta: string; topic: string }
  | { name: "whatsapp_click"; topic: string }
  | { name: "social_click"; network: string }
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

/** Register an additional sink (e.g. a vendor SDK adapter) at app startup. */
export function registerAnalyticsSink(sink: AnalyticsSink): void {
  sinks.push(sink);
}

export function track(event: AnalyticsEvent): void {
  for (const sink of sinks) sink(event);
}
