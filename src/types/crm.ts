/**
 * Application-facing CRM types for the Cristian Barbosa Universe.
 *
 * As of Block 02 the real source of truth is the Postgres schema in
 * supabase/migrations/ (see docs/DATABASE.md) — these types exist for
 * code that wants a plain, DB-client-agnostic shape (e.g. lib/attribution.ts,
 * which has no business importing `pg`). Repository return types in
 * src/server/db/repositories/* are the literal row shapes; this file is
 * the conceptual layer they map onto.
 *
 * Design decision (documented per the "no inventar tablas innecesarias"
 * instruction): a single CONTACT can accumulate multiple SOURCEs,
 * INTERESTs, and INTERACTIONs over time — this is a many-to-many journey
 * model, not a one-row-per-form-submission model. See docs/DATA_MODEL.md
 * for the full rationale.
 *
 * `EventEntity` from Block 01 was retired here: its purpose (a show, a QR
 * scan location, a school visit) is fully covered by `Campaign` +
 * `QrSource` and would have duplicated them — see docs/DATA_MODEL.md §
 * "INTERACTION vs JOURNEY_EVENT" for the same reasoning applied to events.
 */

/** How a contact is known to the system before/without a login. */
export interface Contact {
  id: string;
  createdAt: string;
  /** Nullable until the person shares it via a form, WhatsApp, or checkout. */
  email: string | null;
  phone: string | null;
  fullName: string | null;
  /** First-touch attribution, captured once and never overwritten. */
  firstSource: SourceRef;
  /** Most recent touch, updated on every new attributed visit. */
  lastSource: SourceRef;
}

/** Where a touch/visit/lead came from. Mirrors the attribution utility. */
export interface SourceRef {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  /** The qr_source.slug from a scanned QR, when present. See docs/ATTRIBUTION.md. */
  qrSlug: string | null;
  /** e.g. "qr", "referral", "direct", "organic_search", "organic_social" */
  channel: string | null;
  /** The first landing path of this touch, e.g. "/entrenar". */
  landingPath: string | null;
  referrer: string | null;
  capturedAt: string;
}

/** A registered QR code — an acquisition instrument, not just an image. */
export interface QrSource {
  id: string;
  slug: string;
  campaignSlug: string | null;
  sourceSlug: string | null;
  destinationPath: string;
  active: boolean;
}

/** A canonical outbound social/community link — the single source of truth for /redes. */
export interface SocialProfile {
  id: string;
  slug: string;
  platform: string;
  label: string;
  url: string;
  active: boolean;
  displayOrder: number;
  category: string | null;
}

/** A named acquisition campaign, so multiple touches can roll up to one effort. */
export interface Campaign {
  id: string;
  name: string;
  /** e.g. "show-medellin", "aura-envigado" — matches utm_campaign values. */
  slug: string;
  channel: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

/** A topic within the universe a contact has shown interest in. */
export interface Interest {
  id: string;
  contactId: string;
  /** e.g. "entrenar", "musica", "shows-b2b", "marcas-b2b" — matches route pillars. */
  topic: string;
  createdAt: string;
}

/** A qualified lead — a contact plus the context of the ask. */
export interface Lead {
  id: string;
  contactId: string;
  /** Which pillar route generated this lead. */
  topic: string;
  message: string | null;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  createdAt: string;
}

/** Anything sellable — physical, digital, or a recurring offer. */
export interface Product {
  id: string;
  name: string;
  kind: "physical" | "digital" | "subscription" | "coaching";
  /** External catalog/checkout reference (Facebook Subscription, a course platform, etc.). */
  externalRef: string | null;
}

export interface Order {
  id: string;
  contactId: string;
  productId: string;
  amountCents: number;
  currency: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  contactId: string;
  productId: string;
  status: "active" | "paused" | "canceled";
  startedAt: string;
  canceledAt: string | null;
}

/** A single logged touch — the append-only journal a Contact is built from. */
export interface Interaction {
  id: string;
  contactId: string;
  /** See docs/ANALYTICS.md for the full event taxonomy. */
  eventName: string;
  source: SourceRef;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}
