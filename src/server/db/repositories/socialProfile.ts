import "server-only";
import type { Pool, PoolClient } from "pg";
import type { SocialProfile } from "@/types/crm";

interface SocialProfileRow {
  id: string;
  slug: string;
  platform: string;
  label: string;
  url: string;
  active: boolean;
  display_order: number;
  category: string | null;
}

function toSocialProfile(row: SocialProfileRow): SocialProfile {
  return {
    id: row.id,
    slug: row.slug,
    platform: row.platform,
    label: row.label,
    url: row.url,
    active: row.active,
    displayOrder: row.display_order,
    category: row.category,
  };
}

export async function listActiveSocialProfiles(db: Pool | PoolClient): Promise<SocialProfile[]> {
  const result = await db.query<SocialProfileRow>(
    "select * from social_profile where active = true order by display_order asc",
  );
  return result.rows.map(toSocialProfile);
}

export async function getActiveSocialProfileBySlug(
  db: Pool | PoolClient,
  slug: string,
): Promise<SocialProfile | null> {
  const result = await db.query<SocialProfileRow>(
    "select * from social_profile where slug = $1 and active = true",
    [slug],
  );
  return result.rows[0] ? toSocialProfile(result.rows[0]) : null;
}
