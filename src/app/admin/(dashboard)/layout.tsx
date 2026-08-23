import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { requireAdminSession } from "@/server/auth/adminAuth";
import { AdminNav } from "./AdminNav";
import { LoadingBlock } from "@/components/admin/states";

export const metadata: Metadata = {
  title: { default: "Command Center", template: "%s — Command Center" },
  robots: { index: false, follow: false },
};

/**
 * Shared shell for every protected /admin page. `requireAdminSession()`
 * is the "secure" auth check (docs — Next.js Authentication guide, "Data
 * Access Layer") — src/proxy.ts already ran the "optimistic" version
 * before this even started rendering, but Proxy "should not be your
 * only line of defense" per that same guide, so this redirect is not
 * redundant, it's the actual gate.
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();

  return (
    <>
      <AdminNav />
      {/* useSearchParams (DateRangeControl, useAnalyticsQuery) requires a
          Suspense boundary — one here covers every nested page instead of
          repeating it ten times. */}
      <Container className="py-10">
        <Suspense fallback={<LoadingBlock />}>{children}</Suspense>
      </Container>
    </>
  );
}
