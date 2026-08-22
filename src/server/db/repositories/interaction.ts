import "server-only";
import type { PoolClient } from "pg";
import type { ResolvedTouch } from "./reference";

/**
 * Must match the CHECK constraint on interaction.event_name
 * (0001_init_schema.sql + 0003_analytics_engine.sql). See
 * docs/ANALYTICS_ENGINE.md, "Event taxonomy audit" for why each of the
 * Block 03 additions (contact_created, outbound_click, product_view,
 * offer_view) exists, and why LEAD_CREATED was considered and rejected
 * as a duplicate of lead_submitted.
 */
export const INTERACTION_EVENT_NAMES = [
  "page_view",
  "landing_view",
  "cta_click",
  "social_click",
  "whatsapp_click",
  "outbound_click",
  "lead_submitted",
  "contact_created",
  "interest_selected",
  "product_view",
  "offer_view",
  "checkout_started",
  "purchase",
  "subscription_started",
  "subscription_cancelled",
  "event_registration",
] as const;

export type InteractionEventName = (typeof INTERACTION_EVENT_NAMES)[number];

export type EntityType = "product" | "offer";

export async function recordInteraction(
  client: PoolClient,
  input: {
    visitorId: string;
    contactId: string | null;
    eventName: InteractionEventName;
    route: string | null;
    touch: ResolvedTouch;
    metadata?: Record<string, unknown>;
    /** Polymorphic reference for entity-specific events (product_view/offer_view) — see docs/ANALYTICS_ENGINE.md. */
    entity?: { type: EntityType; id: string };
  },
): Promise<void> {
  await client.query(
    `insert into interaction (
       visitor_id, contact_id, event_name, route,
       source_id, campaign_id, qr_id, medium, content, term, referrer,
       entity_type, entity_id, metadata
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      input.visitorId,
      input.contactId,
      input.eventName,
      input.route,
      input.touch.sourceId,
      input.touch.campaignId,
      input.touch.qrId,
      input.touch.medium,
      input.touch.content,
      input.touch.term,
      input.touch.referrer,
      input.entity?.type ?? null,
      input.entity?.id ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}
