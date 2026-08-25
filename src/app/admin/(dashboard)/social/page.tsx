import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { SocialPageContent } from "./SocialPageContent";

export const metadata: Metadata = { title: "Social routing" };

/**
 * Section 3 — Social routing (FASE 4). Reuses GET /api/analytics/overview
 * (its `social` field, from getSocialPerformance()) rather than adding a
 * dedicated /api/analytics/social route — the brief names 8 endpoints,
 * not 9, and this data already has a home (docs/COMMAND_CENTER.md,
 * "Endpoints used, and why not more"). Measures only Universe → click →
 * redirect → destination — never what happens inside Instagram/Facebook/
 * TikTok themselves (docs/SOCIAL_ROUTING.md). Kept as a Server Component
 * only for `metadata` — see OverviewPageContent.tsx's doc comment for
 * why the content itself moved to a Client Component.
 */
export default function AdminSocialPage() {
  return (
    <>
      <SectionHeader
        tag="Social routing"
        title="/go/[slug] performance"
        description="Clicks salientes desde el Universe hacia cada destino externo — no medimos qué pasa dentro de Instagram/Facebook/TikTok."
      />
      <SocialPageContent />
    </>
  );
}
