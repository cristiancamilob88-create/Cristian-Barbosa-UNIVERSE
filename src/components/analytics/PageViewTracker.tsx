"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * Fires one `landing_view` (when the URL carries a fresh utm_* or qr
 * signal — mirrors src/proxy.ts's own `hasAttributionSignal` check) or
 * `page_view` (otherwise) per route change. Mounted once in the root
 * layout, wrapped in <Suspense> there: `useSearchParams` requires that
 * boundary to avoid forcing every static page in the app into dynamic
 * rendering (see the Next.js docs on useSearchParams + Suspense) — this
 * component itself renders nothing, so the fallback is `null`.
 */
const UTM_AND_QR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "qr"];

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const key = `${pathname}?${searchParams.toString()}`;
    // React 19 Strict Mode double-invokes effects in development; guard
    // against firing the same navigation twice.
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    const hasAttributionSignal = UTM_AND_QR_KEYS.some((k) => searchParams.has(k));
    track(
      hasAttributionSignal ? { name: "landing_view", path: pathname } : { name: "page_view", path: pathname },
    );
  }, [pathname, searchParams]);

  return null;
}
