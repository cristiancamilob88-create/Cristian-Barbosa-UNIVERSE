/**
 * Display-only number formatting shared by every /admin section — one
 * place so a currency/percent format never drifts page to page. Pure,
 * client-safe (no server-only, no env access): `orders.total_cents` is
 * COP (docs/CRM.md), so this is the one currency this app ever renders.
 */

const integerFormatter = new Intl.NumberFormat("es-CO");
const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat("es-CO", {
  style: "percent",
  maximumFractionDigits: 1,
});
const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** `null`/`undefined` render as an em dash — "no denominator yet", never a fabricated 0%. */
export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return percentFormatter.format(value);
}

/** Colombia local time (America/Bogota) — Cristian's own timezone, not the visitor's/server's. */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** `null`/`undefined` render as an em dash — "no samples yet", never a fabricated 0:00. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
