"use client";

import type { ReactNode } from "react";
import { useAnalyticsQuery } from "./useAnalyticsQuery";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "./states";

/**
 * Wraps one `/api/analytics/*` fetch with the standard loading/error/
 * empty handling, so a section page is just "call this endpoint, render
 * the data" — the loading/error/empty branching lives here exactly
 * once, not copy-pasted across ten pages (docs/COMMAND_CENTER.md,
 * "Loading, empty, and error states").
 */
export function AnalyticsBoundary<T>({
  path,
  extra,
  isEmpty,
  emptyMessage,
  children,
}: {
  path: string;
  extra?: Record<string, string | undefined>;
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  children: (data: T) => ReactNode;
}) {
  const state = useAnalyticsQuery<T>(path, extra);

  if (state.status === "loading") return <LoadingBlock />;
  if (state.status === "error") return <ErrorBlock message={state.message} />;
  if (isEmpty?.(state.data)) return <EmptyBlock message={emptyMessage} />;
  return <>{children(state.data)}</>;
}
