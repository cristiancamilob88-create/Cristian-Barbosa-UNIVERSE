import "server-only";
import type { PoolClient } from "pg";
import type { VisitorRow } from "./visitor";

export interface ContactRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
}

/**
 * Finds an existing contact by email (case-insensitive, via `citext`)
 * then phone, or creates one — copying the visitor's current touch as
 * both first- and last-touch (this is, by definition, the first time
 * we've identified this visitor). On an existing contact, only
 * last-touch is refreshed; first-touch is never touched here (and the
 * DB trigger would reject it if this code tried).
 *
 * Email/phone are the matching signals per the brief ("Email and/or
 * phone can be matching signals where appropriate") — deliberately no
 * fuzzy name matching, which would produce false-positive merges.
 */
export async function findOrCreateContact(
  client: PoolClient,
  input: {
    email: string | null;
    phone: string | null;
    name: string | null;
    /** Privacy-policy version the person just authorized (Ley 1581/2012) — recorded with now() as proof. Omit when no authorization was given in this request. */
    consentVersion?: string | null;
  },
  visitor: VisitorRow,
): Promise<{ contact: ContactRow; created: boolean }> {
  const email = input.email?.trim() || null;
  const phone = input.phone?.trim() || null;

  let existing: ContactRow | null = null;
  if (email) {
    const result = await client.query<ContactRow>("select id, name, email, phone, status from contact where email = $1", [
      email,
    ]);
    existing = result.rows[0] ?? null;
  }
  if (!existing && phone) {
    const result = await client.query<ContactRow>("select id, name, email, phone, status from contact where phone = $1", [
      phone,
    ]);
    existing = result.rows[0] ?? null;
  }

  if (existing) {
    const updated = await client.query<ContactRow>(
      `update contact set
         name = coalesce(contact.name, $2),
         email = coalesce(contact.email, $3),
         phone = coalesce(contact.phone, $4),
         last_touch_source_id = $5,
         last_touch_campaign_id = $6,
         last_touch_qr_id = $7,
         last_touch_medium = $8,
         last_touch_content = $9,
         last_touch_term = $10,
         last_touch_referrer = $11,
         last_touch_landing_path = $12,
         last_touch_captured_at = $13,
         data_consent_at = case when $14::text is not null then now() else contact.data_consent_at end,
         data_consent_version = coalesce($14::text, contact.data_consent_version)
       where id = $1
       returning id, name, email, phone, status`,
      [
        existing.id,
        input.name,
        email,
        phone,
        visitor.last_touch_source_id,
        visitor.last_touch_campaign_id,
        visitor.last_touch_qr_id,
        visitor.last_touch_medium,
        visitor.last_touch_content,
        visitor.last_touch_term,
        visitor.last_touch_referrer,
        visitor.last_touch_landing_path,
        visitor.last_touch_captured_at,
        input.consentVersion ?? null,
      ],
    );
    return { contact: updated.rows[0], created: false };
  }

  const created = await client.query<ContactRow>(
    `insert into contact (
       name, email, phone,
       first_touch_source_id, first_touch_campaign_id, first_touch_qr_id,
       first_touch_medium, first_touch_content, first_touch_term,
       first_touch_referrer, first_touch_landing_path, first_touch_captured_at,
       last_touch_source_id, last_touch_campaign_id, last_touch_qr_id,
       last_touch_medium, last_touch_content, last_touch_term,
       last_touch_referrer, last_touch_landing_path, last_touch_captured_at,
       data_consent_at, data_consent_version
     ) values (
       $1, $2, $3,
       $4, $5, $6, $7, $8, $9, $10, $11, $12,
       $4, $5, $6, $7, $8, $9, $10, $11, $12,
       case when $13::text is not null then now() end, $13::text
     )
     returning id, name, email, phone, status`,
    [
      input.name,
      email,
      phone,
      visitor.first_touch_source_id ?? visitor.last_touch_source_id,
      visitor.first_touch_campaign_id ?? visitor.last_touch_campaign_id,
      visitor.first_touch_qr_id ?? visitor.last_touch_qr_id,
      visitor.first_touch_medium ?? visitor.last_touch_medium,
      visitor.first_touch_content ?? visitor.last_touch_content,
      visitor.first_touch_term ?? visitor.last_touch_term,
      visitor.first_touch_referrer ?? visitor.last_touch_referrer,
      visitor.first_touch_landing_path ?? visitor.last_touch_landing_path,
      visitor.first_touch_captured_at ?? visitor.last_touch_captured_at,
      input.consentVersion ?? null,
    ],
  );
  return { contact: created.rows[0], created: true };
}

export async function assignInterest(
  client: PoolClient,
  contactId: string,
  interestId: string,
): Promise<void> {
  await client.query(
    `insert into contact_interest (contact_id, interest_id) values ($1, $2)
     on conflict do nothing`,
    [contactId, interestId],
  );
}
