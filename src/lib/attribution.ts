import type { SourceRef } from "@/types/crm";

/**
 * Attribution architecture, in one file.
 *
 * Decision: capture UTM/QR/referral data into two first-party cookies
 * (first-touch, last-touch) at the edge, in middleware.ts, rather than
 * relying on a form field or a third-party pixel. Forms remain the place
 * a person *confirms* who they are; attribution should already be known
 * by then. Both cookies store the same SourceRef shape so a later CRM
 * block can read them without re-deriving anything.
 *
 * Privacy: these cookies carry only campaign labels the visitor's own URL
 * or referrer already exposed (utm_*, channel, landing path, referrer) —
 * no fingerprinting, no third-party ID. They are functional/analytics
 * cookies, not advertising cookies, and are documented as such wherever
 * a consent banner is introduced (see docs/ARCHITECTURE.md, Security).
 */

export const FIRST_TOUCH_COOKIE = "cb_attr_first";
export const LAST_TOUCH_COOKIE = "cb_attr_last";

/** How long a first-touch attribution is remembered before it's considered stale. */
export const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * Classifies a visit into a broad channel bucket. QR campaigns pass
 * utm_medium=qr explicitly (see QR architecture in docs/ARCHITECTURE.md);
 * everything else falls back to referrer-based heuristics.
 */
export function classifyChannel(params: URLSearchParams, referrer: string | null): string {
  const medium = params.get("utm_medium");
  if (medium) return medium.toLowerCase();
  if (params.get("utm_source")) return "campaign";
  if (!referrer) return "direct";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (/instagram|tiktok|facebook|x\.com|twitter/i.test(host)) return "organic_social";
    if (/google|bing|duckduckgo/i.test(host)) return "organic_search";
    return "referral";
  } catch {
    return "referral";
  }
}

/** Pure parse: URL search params + referrer + landing path -> SourceRef. No I/O. */
export function parseSource(
  params: URLSearchParams,
  referrer: string | null,
  landingPath: string,
  now: Date = new Date(),
): SourceRef {
  const [utmSource, utmMedium, utmCampaign, utmContent, utmTerm] = UTM_KEYS.map((key) =>
    params.get(key),
  );

  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    channel: classifyChannel(params, referrer),
    landingPath,
    referrer,
    capturedAt: now.toISOString(),
  };
}

/** True when the request URL carries any attribution signal worth capturing. */
export function hasAttributionSignal(params: URLSearchParams): boolean {
  return UTM_KEYS.some((key) => params.has(key));
}

export function serializeSource(source: SourceRef): string {
  return JSON.stringify(source);
}

export function deserializeSource(raw: string | undefined | null): SourceRef | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SourceRef>;
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
      utmContent: parsed.utmContent ?? null,
      utmTerm: parsed.utmTerm ?? null,
      channel: parsed.channel ?? null,
      landingPath: parsed.landingPath ?? null,
      referrer: parsed.referrer ?? null,
      capturedAt: parsed.capturedAt ?? new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}
