"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchAnalytics, AnalyticsApiError, type RangeQuery, type DateRangePreset } from "@/lib/adminAnalytics";

export type QueryState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

/** Reads the shared `range`/`from`/`to` URL params every /admin page's DateRangeControl writes to. */
export function useRangeFromSearchParams(): RangeQuery {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  if (from) return { from, to: searchParams.get("to") ?? undefined };
  return { range: (searchParams.get("range") as DateRangePreset | null) ?? "30d" };
}

interface KeyedState<T> {
  key: string;
  result: QueryState<T>;
}

/**
 * The one data-fetching hook every /admin section page uses — calls an
 * existing `/api/analytics/*` endpoint (never Postgres directly) and
 * exposes loading/error/ready as a single discriminated union so every
 * page renders the same three states the same way (docs/COMMAND_CENTER.md,
 * "Loading, empty, and error states").
 *
 * Resets to "loading" the moment `key` (path + range + extra params)
 * changes by comparing during render, not inside the effect — React's
 * own "adjusting state when a prop changes" pattern (see the Next.js/
 * React docs on useEffect) — an unconditional `setState` at the top of
 * the effect body trips `react-hooks/set-state-in-effect`.
 */
export function useAnalyticsQuery<T>(path: string, extra?: Record<string, string | undefined>): QueryState<T> {
  return useAnalyticsQueryForRange<T>(path, useRangeFromSearchParams(), extra);
}

/**
 * Same as useAnalyticsQuery, but for an explicit range instead of the
 * URL's own — the one caller today is the Overview page's "vs. período
 * anterior" comparison (src/components/admin/DeltaBadge.tsx's data
 * source), which needs the *previous* period, not the one in the URL.
 */
export function useAnalyticsQueryForRange<T>(
  path: string,
  range: RangeQuery,
  extra?: Record<string, string | undefined>,
): QueryState<T> {
  const extraKey = extra ? JSON.stringify(extra) : "";
  const key = `${path}|${range.range ?? ""}|${range.from ?? ""}|${range.to ?? ""}|${extraKey}`;

  const [state, setState] = useState<KeyedState<T>>({ key, result: { status: "loading" } });

  let current = state;
  if (state.key !== key) {
    current = { key, result: { status: "loading" } };
    setState(current);
  }

  useEffect(() => {
    let cancelled = false;

    fetchAnalytics<T>(path, range, extra)
      .then((data) => {
        if (!cancelled) setState({ key, result: { status: "ready", data } });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof AnalyticsApiError ? err.message : "Error inesperado consultando analytics.";
        setState({ key, result: { status: "error", message } });
      });

    return () => {
      cancelled = true;
    };
    // `key` already encodes path + range + extra — see note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return current.result;
}
