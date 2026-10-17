import "server-only";
import crypto from "node:crypto";
import type { PoolClient } from "pg";

/**
 * Student sign-in by emailed 6-digit code (docs/TRAINING.md, "Sign-in").
 *
 * Why a code and not a magic link: students install /mi-plan on their
 * phone's home screen. On iOS a link tapped in the mail app opens
 * Safari, not the installed app, so the session would land in the wrong
 * place; a code is typed inside the app itself. Why not Supabase Auth:
 * this app never talks to Supabase from the browser (every query is
 * server-side through src/server/db/), so a second client, a JWT format
 * and an `auth.users` mirror would be a lot of machinery for "prove you
 * own this inbox" — which is all this is.
 *
 * Only an HMAC of the code is stored (keyed by MEMBER_SESSION_SECRET and
 * bound to the contact), never the code. A code lives CODE_TTL_MS, allows
 * MAX_ATTEMPTS wrong guesses, and works once. A new one can't be issued
 * more than once per RESEND_COOLDOWN_MS per contact, so the form can't be
 * used to flood someone's inbox.
 */

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

export interface EligibleMember {
  contactId: string;
  name: string | null;
  email: string;
}

function hashCode(contactId: string, code: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${contactId}:${code}`).digest("hex");
}

/**
 * The contact behind an email, if they can sign in: at least one started
 * enrollment (active/paused/finished) backed by its entitlement. A
 * pending sign-up can't sign in yet — there's nothing to show them until
 * Cristian approves it.
 */
export async function findEligibleMember(client: PoolClient, email: string): Promise<EligibleMember | null> {
  const result = await client.query<{ id: string; name: string | null; email: string }>(
    `select c.id, c.name, c.email::text as email
     from contact c
     where c.email = $1
       and exists (
         select 1 from training_enrollment e
         join entitlement ent on ent.contact_id = e.contact_id and ent.product_id = e.product_id
         where e.contact_id = c.id
           and e.status in ('active', 'paused', 'finished')
           and e.start_date is not null
       )`,
    [email.trim()],
  );
  const row = result.rows[0];
  return row ? { contactId: row.id, name: row.name, email: row.email } : null;
}

export type IssueCodeResult =
  | { status: "issued"; member: EligibleMember; code: string }
  | { status: "not_eligible" }
  | { status: "cooldown" };

/** Creates a fresh code for an eligible member. The caller emails it; this never sends anything itself. */
export async function issueLoginCode(
  client: PoolClient,
  email: string,
  secret: string,
  now: Date = new Date(),
): Promise<IssueCodeResult> {
  const member = await findEligibleMember(client, email);
  if (!member) return { status: "not_eligible" };

  const recent = await client.query(
    "select 1 from member_login_code where contact_id = $1 and created_at > $2 limit 1",
    [member.contactId, new Date(now.getTime() - RESEND_COOLDOWN_MS).toISOString()],
  );
  if ((recent.rowCount ?? 0) > 0) return { status: "cooldown" };

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await client.query(
    "insert into member_login_code (contact_id, code_hash, expires_at, created_at) values ($1, $2, $3, $4)",
    [member.contactId, hashCode(member.contactId, code, secret), new Date(now.getTime() + CODE_TTL_MS).toISOString(), now.toISOString()],
  );
  return { status: "issued", member, code };
}

export type VerifyCodeResult =
  | { status: "ok"; contactId: string }
  | { status: "needs_consent" }
  | { status: "invalid" }
  | { status: "locked" };

/**
 * Checks a code against the contact's latest unused, unexpired one.
 *
 * Data-processing authorization (Ley 1581): a student Cristian added by
 * hand from /admin never ticked the site form's consent box, so the
 * first sign-in asks for it. A correct code from someone without a
 * recorded consent answers `needs_consent` WITHOUT using up the code or
 * an attempt; the form shows the checkbox and resubmits with
 * `consent: true`, which records it (same columns /api/lead writes).
 */
export async function verifyLoginCode(
  client: PoolClient,
  input: { email: string; code: string; consent: boolean; consentVersion: string },
  secret: string,
  now: Date = new Date(),
): Promise<VerifyCodeResult> {
  const member = await findEligibleMember(client, input.email);
  if (!member) return { status: "invalid" };

  const latest = await client.query<{ id: string; code_hash: string; attempts: number }>(
    `select id, code_hash, attempts from member_login_code
     where contact_id = $1 and consumed_at is null and expires_at > $2
     order by created_at desc
     limit 1
     for update`,
    [member.contactId, now.toISOString()],
  );
  const row = latest.rows[0];
  if (!row) return { status: "invalid" };
  if (Number(row.attempts) >= MAX_ATTEMPTS) return { status: "locked" };

  const expected = Buffer.from(row.code_hash, "hex");
  const actual = Buffer.from(hashCode(member.contactId, input.code.trim(), secret), "hex");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    await client.query("update member_login_code set attempts = attempts + 1 where id = $1", [row.id]);
    return Number(row.attempts) + 1 >= MAX_ATTEMPTS ? { status: "locked" } : { status: "invalid" };
  }

  const consent = await client.query<{ data_consent_at: string | null }>(
    "select data_consent_at from contact where id = $1",
    [member.contactId],
  );
  if (!consent.rows[0]?.data_consent_at) {
    if (!input.consent) return { status: "needs_consent" };
    await client.query("update contact set data_consent_at = now(), data_consent_version = $2 where id = $1", [
      member.contactId,
      input.consentVersion,
    ]);
  }

  await client.query("update member_login_code set consumed_at = $2 where id = $1", [row.id, now.toISOString()]);
  return { status: "ok", contactId: member.contactId };
}
