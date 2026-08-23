import "server-only";
import type { PoolClient } from "pg";
import type { ResolvedTouch } from "./reference";

export type B2bCategory = "shows" | "brands" | "sponsors";

export interface B2bOpportunityRow {
  id: string;
  contact_id: string;
  category: B2bCategory;
  stage: string;
}

/**
 * `b2b_opportunity` existed since Block 02 (docs/DATA_MODEL.md, "A
 * lightweight pipeline for shows/brands/sponsors") but had no writer —
 * `/shows`/`/marcas` only ever created a generic `lead` row. Block 07
 * makes it a real second write alongside the lead, not a replacement:
 * `lead` stays the "is there an open ask that needs a reply" record for
 * every topic; `b2b_opportunity` is the shows/brands-specific pipeline
 * (`stage` tracking) the brief's B2B framing needs on top of that.
 * `estimated_value_cents` starts null — never invent a deal size from a
 * contact-form submission.
 */
export async function createB2bOpportunity(
  client: PoolClient,
  input: {
    contactId: string;
    category: B2bCategory;
    notes: string | null;
    touch: ResolvedTouch;
  },
): Promise<B2bOpportunityRow> {
  const result = await client.query<B2bOpportunityRow>(
    `insert into b2b_opportunity (
       contact_id, source_id, campaign_id, category, notes
     ) values ($1, $2, $3, $4, $5)
     returning id, contact_id, category, stage`,
    [input.contactId, input.touch.sourceId, input.touch.campaignId, input.category, input.notes],
  );
  return result.rows[0];
}
