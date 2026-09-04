import "server-only";
import type { Pool, PoolClient } from "pg";

/**
 * Read side of `qr_source`, for a QR-specific landing page to greet a
 * visitor by campaign name — distinct from `resolveQrId()`
 * (src/server/db/repositories/reference.ts), the write-path lookup used
 * only to resolve an attribution slug into an id. This one is a display
 * read, so it joins `campaign`/`source` for their human-readable labels.
 */
export interface QrLanding {
  slug: string;
  campaignName: string | null;
  sourceLabel: string | null;
  /** Per-campaign reel override (0009) — null means the page uses its own default. */
  instagramReelUrl: string | null;
  /** social_profile.slug for a second, campaign-specific WhatsApp card (0009) — null means not shown. */
  secondaryWhatsappSlug: string | null;
  secondaryWhatsappLabel: string | null;
  /** Short per-campaign announcement line (0010) — null means no announcement block shown. */
  eventDescription: string | null;
  /** Optional real press coverage link (0011) — null means no "En los medios" block shown. */
  pressUrl: string | null;
  pressLabel: string | null;
  /** Per-campaign hero photo override (0012) — null means the page's own default. */
  heroImageUrl: string | null;
  /** Optional photo of the actual press coverage (0012) — null means the press block shows text only. */
  pressImageUrl: string | null;
}

interface QrLandingRow {
  slug: string;
  campaign_name: string | null;
  source_label: string | null;
  instagram_reel_url: string | null;
  secondary_whatsapp_slug: string | null;
  secondary_whatsapp_label: string | null;
  event_description: string | null;
  press_url: string | null;
  press_label: string | null;
  hero_image_url: string | null;
  press_image_url: string | null;
}

export async function getActiveQrLanding(db: Pool | PoolClient, slug: string): Promise<QrLanding | null> {
  const result = await db.query<QrLandingRow>(
    `select qs.slug, c.name as campaign_name, s.label as source_label,
            c.instagram_reel_url, c.secondary_whatsapp_slug, c.secondary_whatsapp_label,
            c.event_description, c.press_url, c.press_label,
            c.hero_image_url, c.press_image_url
     from qr_source qs
     left join campaign c on c.id = qs.campaign_id
     left join source s on s.id = qs.source_id
     where qs.slug = $1 and qs.active = true`,
    [slug.trim().toLowerCase()],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    slug: row.slug,
    campaignName: row.campaign_name,
    sourceLabel: row.source_label,
    instagramReelUrl: row.instagram_reel_url,
    secondaryWhatsappSlug: row.secondary_whatsapp_slug,
    secondaryWhatsappLabel: row.secondary_whatsapp_label,
    eventDescription: row.event_description,
    pressUrl: row.press_url,
    pressLabel: row.press_label,
    heroImageUrl: row.hero_image_url,
    pressImageUrl: row.press_image_url,
  };
}
