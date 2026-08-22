/**
 * Shared date-range resolution for every analytics read model — see
 * docs/ANALYTICS_ENGINE.md, "Date ranges". Pure function (no DB, no
 * server-only), unit tested directly.
 */

export const DATE_RANGE_PRESETS = ["today", "7d", "30d", "90d"] as const;
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export interface ResolvedDateRange {
  from: Date;
  to: Date;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Resolves a preset (`today`/`7d`/`30d`/`90d`) or an explicit
 * `{ from, to }` ISO-string custom range into concrete `Date` bounds.
 * `to` defaults to "now" — every preset is a trailing window ending now,
 * not a calendar-aligned bucket, so "today" means "since midnight UTC",
 * not "the last 24 hours".
 */
export function resolveDateRange(
  input: DateRangePreset | { from: string; to?: string },
  now: Date = new Date(),
): ResolvedDateRange {
  if (typeof input === "object") {
    const from = new Date(input.from);
    const to = input.to ? new Date(input.to) : now;
    if (Number.isNaN(from.getTime())) throw new Error(`Invalid "from" date: ${input.from}`);
    if (Number.isNaN(to.getTime())) throw new Error(`Invalid "to" date: ${input.to}`);
    if (from > to) throw new Error(`"from" must not be after "to" (${input.from} > ${input.to})`);
    return { from, to };
  }

  switch (input) {
    case "today":
      return { from: startOfUtcDay(now), to: now };
    case "7d":
      return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };
    case "30d":
      return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now };
    case "90d":
      return { from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), to: now };
    default: {
      const exhaustive: never = input;
      throw new Error(`Unknown date range preset: ${exhaustive}`);
    }
  }
}

/** Parses the `range`/`from`/`to` query params every /api/analytics/* route accepts identically. */
export function parseDateRangeParams(searchParams: URLSearchParams): ResolvedDateRange {
  const from = searchParams.get("from");
  if (from) {
    return resolveDateRange({ from, to: searchParams.get("to") ?? undefined });
  }

  const range = searchParams.get("range") ?? "30d";
  if (!(DATE_RANGE_PRESETS as readonly string[]).includes(range)) {
    throw new Error(`Unknown range "${range}" — expected one of ${DATE_RANGE_PRESETS.join(", ")}, or ?from=...`);
  }
  return resolveDateRange(range as DateRangePreset);
}
