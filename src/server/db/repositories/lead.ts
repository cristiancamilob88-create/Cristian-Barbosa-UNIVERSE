import "server-only";
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
    touch: ResolvedTouch;
  },
): Promise<LeadRow> {
  const result = await client.query<LeadRow>(
    `insert into lead (
       contact_id, interest_id, topic_raw, message, source_id, campaign_id, qr_id
     ) values ($1, $2, $3, $4, $5, $6, $7)
     returning id, contact_id, status`,
    [
      input.contactId,
      input.interestId,
      input.topicRaw,
      input.message,
      input.touch.sourceId,
      input.touch.campaignId,
      input.touch.qrId,
    ],
  );
  return result.rows[0];
}
