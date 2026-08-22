import "server-only";
import type { PoolClient } from "pg";
import type { SourceRef } from "@/types/crm";

/**
 * Resolves the free-text attribution slugs a visitor's URL/cookie carries
 * (utm_source, utm_campaign, qr) into the ids the rest of the schema is
 * built on (source_id, campaign_id, qr_id).
 *
 * `source` and `campaign` are extensible dictionaries — an unrecognized
 * slug is find-or-created, not rejected, per the "do not hard-code the
 * system around current sources" instruction (docs/ATTRIBUTION.md).
 * `qr_source` and `interest` are NOT auto-created: a QR must be
 * pre-registered (it points at a real printed/shared code) and an
 * interest is a deliberately small canonical vocabulary — an unknown
 * value for either resolves to null rather than polluting the dictionary.
 */

export interface ResolvedTouch {
  sourceId: string | null;
  campaignId: string | null;
  qrId: string | null;
  medium: string | null;
  content: string | null;
  term: string | null;
  referrer: string | null;
  landingPath: string | null;
  capturedAt: string | null;
}

export async function resolveSourceId(client: PoolClient, slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const existing = await client.query<{ id: string }>("select id from source where slug = $1", [
    normalized,
  ]);
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await client.query<{ id: string }>(
    `insert into source (slug, label, category)
     values ($1, $1, 'other')
     on conflict (slug) do update set slug = excluded.slug
     returning id`,
    [normalized],
  );
  return created.rows[0].id;
}

export async function resolveCampaignId(client: PoolClient, slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const existing = await client.query<{ id: string }>("select id from campaign where slug = $1", [
    normalized,
  ]);
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await client.query<{ id: string }>(
    `insert into campaign (slug, name)
     values ($1, $1)
     on conflict (slug) do update set slug = excluded.slug
     returning id`,
    [normalized],
  );
  return created.rows[0].id;
}

export async function resolveQrId(client: PoolClient, slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const result = await client.query<{ id: string }>(
    "select id from qr_source where slug = $1 and active = true",
    [slug.trim().toLowerCase()],
  );
  return result.rows[0]?.id ?? null;
}

export async function resolveInterestId(client: PoolClient, slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const result = await client.query<{ id: string }>("select id from interest where slug = $1", [
    slug.trim().toLowerCase(),
  ]);
  return result.rows[0]?.id ?? null;
}

/** Resolves a whole SourceRef (as read from an attribution cookie) into DB ids in one pass. */
export async function resolveTouch(client: PoolClient, source: SourceRef | null): Promise<ResolvedTouch> {
  if (!source) {
    return {
      sourceId: null,
      campaignId: null,
      qrId: null,
      medium: null,
      content: null,
      term: null,
      referrer: null,
      landingPath: null,
      capturedAt: null,
    };
  }

  // Sequential, not Promise.all: all three share one PoolClient (one
  // Postgres connection), which cannot run overlapping queries — pg only
  // tolerates concurrent calls on the same client by silently queueing
  // them (deprecated, slated for removal, and not something to rely on
  // for correctness). Each call here still round-trips independently,
  // just not concurrently.
  const sourceId = await resolveSourceId(client, source.utmSource);
  const campaignId = await resolveCampaignId(client, source.utmCampaign);
  const qrId = await resolveQrId(client, source.qrSlug);

  return {
    sourceId,
    campaignId,
    qrId,
    medium: source.utmMedium,
    content: source.utmContent,
    term: source.utmTerm,
    referrer: source.referrer,
    landingPath: source.landingPath,
    capturedAt: source.capturedAt,
  };
}
