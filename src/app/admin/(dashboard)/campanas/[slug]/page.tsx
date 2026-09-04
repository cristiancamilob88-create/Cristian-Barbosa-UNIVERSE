import type { Metadata } from "next";
import { CampanaDetailPageContent } from "./CampanaDetailPageContent";

/**
 * Static title from the URL param only — no Postgres read here (the
 * `/admin/*` rule: every section fetches an existing `/api/analytics/*`
 * endpoint from a Client Component, never queries the database from a
 * Server Component/page). The real campaign name renders inside
 * `CampanaDetailPageContent` once its client-side fetch resolves.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Campaña — ${slug}` };
}

export default function AdminCampanaDetailPage() {
  return <CampanaDetailPageContent />;
}
