import "server-only";
import type { EventAddress } from "@/lib/eventAddress";
import type { PoolClient } from "pg";
import type { ResolvedTouch } from "./reference";

export interface LeadRow {
  id: string;
  contact_id: string;
  status: string;
}

export async function createLead(
  client: PoolClient,
  input: {
    contactId: string;
    interestId: string | null;
    topicRaw: string;
    message: string | null;
    /** Event location for a shows request (migration 0016); null otherwise. */
    eventAddress?: EventAddress | null;
    touch: ResolvedTouch;
  },
): Promise<LeadRow> {
  const result = await client.query<LeadRow>(
    `insert into lead (
       contact_id, interest_id, topic_raw, message, source_id, campaign_id, qr_id, medium,
       event_address_line, event_address_detail, event_city, event_region, event_postal_code,
       event_country, event_latitude, event_longitude, event_place_id
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     returning id, contact_id, status`,
    [
      input.contactId,
      input.interestId,
      input.topicRaw,
      input.message,
      input.touch.sourceId,
      input.touch.campaignId,
      input.touch.qrId,
      input.touch.medium,
      input.eventAddress?.line ?? null,
      input.eventAddress?.detail ?? null,
      input.eventAddress?.city ?? null,
      input.eventAddress?.region ?? null,
      input.eventAddress?.postalCode ?? null,
      input.eventAddress?.country ?? null,
      input.eventAddress?.latitude ?? null,
      input.eventAddress?.longitude ?? null,
      input.eventAddress?.placeId ?? null,
    ],
  );
  return result.rows[0];
}
