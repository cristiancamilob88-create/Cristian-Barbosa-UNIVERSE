/**
 * Conceptual CRM data model for the Cristian Barbosa Universe.
 *
 * These are TypeScript types only — there is no database behind them yet.
 * They exist so that (a) every route/lib in this foundation block agrees
 * on the shape of a contact/lead/interaction before any backend is built,
 * and (b) the next block (CRM data layer) has an already-reviewed contract
 * to turn into real tables instead of inventing one from scratch.
 *
 * Design decision (documented per the "no inventar tablas innecesarias"
 * instruction): a single CONTACT can accumulate multiple SOURCEs,
 * INTERESTs, and INTERACTIONs over time — this is a many-to-many journey
 * model, not a one-row-per-form-submission model. See docs/DATA_MODEL.md
 * for the full rationale and the recommended storage engine.
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
  /** e.g. "qr", "referral", "direct", "organic_search", "organic_social" */
  channel: string | null;
  /** The first landing path of this touch, e.g. "/entrenar". */
  landingPath: string | null;
  referrer: string | null;
  capturedAt: string;
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

/** A live/physical touchpoint: a show, a QR scan location, a school visit. */
export interface EventEntity {
  id: string;
  name: string;
  kind: "show" | "qr_campaign" | "community_event";
  occursAt: string | null;
  location: string | null;
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
