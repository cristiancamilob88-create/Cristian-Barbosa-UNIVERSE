import "server-only";
import type { PoolClient } from "pg";
import type { ResolvedTouch } from "./reference";

/** Must match the CHECK constraint on interaction.event_name in 0001_init_schema.sql. */
export const INTERACTION_EVENT_NAMES = [
  "page_view",
  "landing_view",
  "cta_click",
  "social_click",
  "whatsapp_click",
  "lead_submitted",
  "interest_selected",
  "checkout_started",
  "purchase",
  "subscription_started",
  "subscription_cancelled",
  "event_registration",
] as const;

export type InteractionEventName = (typeof INTERACTION_EVENT_NAMES)[number];

export async function recordInteraction(
  client: PoolClient,
  input: {
    visitorId: string;
    contactId: string | null;
    eventName: InteractionEventName;
    route: string | null;
    touch: ResolvedTouch;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `insert into interaction (
       visitor_id, contact_id, event_name, route, source_id, campaign_id, qr_id, metadata
     ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.visitorId,
      input.contactId,
      input.eventName,
      input.route,
      input.touch.sourceId,
      input.touch.campaignId,
      input.touch.qrId,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}
