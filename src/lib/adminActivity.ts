/**
 * Client-side contract + plain-Spanish labels for /admin/actividad
 * (src/server/analytics/activity.ts). Cristian's ask (2026-10-07): read
 * the day's traffic as "who touched which button" without decoding ids
 * like `intent_music_early_access` or `/go/whatsapp-commercial`.
 *
 * Labels are derived from the same config the site itself renders from
 * (nav intents, blog/show titles), so a renamed button stays in sync;
 * anything unknown falls back to the raw id rather than guessing.
 */

import { navItems, secondaryNavItems } from "@/config/site";
import { blogPosts, blogPostPath } from "@/content/blog";
import { pastShows, pastShowPath, pastShowsIndexPath } from "@/config/pastShows";
import type { ResolvedRange } from "./adminAnalytics";

// ---- Response shape (mirror of src/server/analytics/activity.ts) ----

export interface ActivityStep {
  at: string;
  eventName: string;
  route: string | null;
  cta: string | null;
  slug: string | null;
  offerSlug: string | null;
}

export interface ActivityVisitor {
  label: string;
  firstAt: string;
  lastAt: string;
  source: string | null;
  campaign: string | null;
  qr: string | null;
  isContact: boolean;
  steps: ActivityStep[];
}

export interface ActivityResponse {
  ok: true;
  range: ResolvedRange;
  data: ActivityVisitor[];
  truncated: boolean;
}

// ---- Colombia calendar days ----

/** Colombia is UTC-5 all year (no DST). */
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A Colombian calendar day as a `{ from, to }` range: `daysAgo` 0 = today
 * (midnight Bogotá → now), 1 = yesterday (full day). The API's own
 * "today" preset is midnight UTC — 7 p. m. the previous evening in
 * Colombia — which would mix two of Cristian's days together.
 */
export function bogotaDayRange(daysAgo: number, now: Date = new Date()): { from: string; to: string } {
  const bogotaNow = now.getTime() - BOGOTA_OFFSET_MS;
  const bogotaMidnight = Math.floor(bogotaNow / DAY_MS) * DAY_MS;
  const from = bogotaMidnight - daysAgo * DAY_MS + BOGOTA_OFFSET_MS;
  const to = Math.min(from + DAY_MS, now.getTime());
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
}

const timeFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatBogotaTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

// ---- Labels ----

const allNavItems = [...navItems, ...secondaryNavItems];

const ROUTE_LABELS: Record<string, string> = {
  "/": "Inicio",
  "/privacidad": "Privacidad",
  "/terminos": "Términos",
  "/redes": "Redes",
  [pastShowsIndexPath]: "Shows realizados",
  ...Object.fromEntries(allNavItems.map((item) => [item.href, item.label])),
  ...Object.fromEntries(blogPosts.map((post) => [blogPostPath(post.slug), `Blog: "${post.title}"`])),
  ...Object.fromEntries(pastShows.map((show) => [pastShowPath(show.slug), `Show: ${show.title}`])),
};

/** Buttons whose id isn't a nav intent — label = the button's visible text. */
const CTA_LABELS: Record<string, string> = {
  ...Object.fromEntries(allNavItems.map((item) => [item.intentId, item.intent])),
  intent_training_course: "Quiero aprender calistenia (curso)",
  intent_products_physical: "Quiero ver los productos (físicos)",
  intent_music_early_access: "Quiero escucharla antes que nadie (El Diamante)",
};

const GO_LINK_LABELS: Record<string, string> = {
  "whatsapp-community": "Comunidad de WhatsApp",
  "whatsapp-commercial": "WhatsApp comercial (negocios)",
  "instagram-main": "Instagram",
  "instagram-community": "Instagram (comunidad)",
  "tiktok-main": "TikTok",
  "tiktok-secondary": "TikTok (segunda cuenta)",
  "youtube-main": "YouTube",
  "x-main": "X (Twitter)",
  "linkedin-main": "LinkedIn",
  "facebook-main": "Facebook",
  "facebook-secondary": "Facebook (segunda cuenta)",
  "facebook-subscription": "Suscripción de Facebook",
  "paypal-donate": "Donar por PayPal",
  "nequi-donate": "Donar por Nequi",
};

export function routeLabel(route: string | null): string {
  if (!route) return "—";
  const path = route.split("?")[0];
  if (path.startsWith("/bienvenida/")) return `Bienvenida del QR (${path.slice("/bienvenida/".length)})`;
  return ROUTE_LABELS[path] ?? path;
}

export function ctaLabel(cta: string | null): string {
  if (!cta) return "un botón";
  return CTA_LABELS[cta] ?? cta;
}

export function goLinkLabel(slug: string | null, route: string | null): string {
  const resolved = slug ?? route?.replace(/^\/go\//, "") ?? null;
  if (!resolved) return "un link externo";
  return GO_LINK_LABELS[resolved] ?? resolved;
}

export type StepTone = "view" | "click" | "out" | "win";

/** One timeline line in plain Spanish, plus a tone for its color. */
export function describeStep(step: ActivityStep): { text: string; tone: StepTone } {
  switch (step.eventName) {
    case "landing_view":
      return { text: `Llegó al sitio por ${routeLabel(step.route)}`, tone: "view" };
    case "page_view":
      return { text: `Abrió ${routeLabel(step.route)}`, tone: "view" };
    case "cta_click":
      return { text: `Tocó el botón "${ctaLabel(step.cta)}" en ${routeLabel(step.route)}`, tone: "click" };
    case "social_click":
      return { text: `Se fue a ${goLinkLabel(step.slug, step.route)}`, tone: "out" };
    case "whatsapp_click":
      return { text: `Tocó ${goLinkLabel(step.slug, step.route)}`, tone: "out" };
    case "outbound_click":
      return { text: `Salió a ${goLinkLabel(step.slug, step.route)}`, tone: "out" };
    case "checkout_started":
      return { text: `Tocó PAGAR (${step.offerSlug ?? "una oferta"}) — no significa que haya pagado`, tone: "click" };
    case "purchase":
      return { text: "¡Compró! Pago confirmado", tone: "win" };
    case "lead_submitted":
      return { text: "Envió el formulario de contacto", tone: "win" };
    case "contact_created":
      return { text: "Quedó registrado como contacto", tone: "win" };
    case "subscription_started":
      return { text: "Se suscribió", tone: "win" };
    case "event_registration":
      return { text: "Se inscribió a un evento", tone: "win" };
    case "product_view":
    case "offer_view":
      return { text: `Vio un producto en ${routeLabel(step.route)}`, tone: "view" };
    default:
      return { text: `${step.eventName} en ${routeLabel(step.route)}`, tone: "view" };
  }
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  google: "Google",
  qr: "Código QR",
};

/** "De dónde vino", in words. */
export function originLabel(visitor: Pick<ActivityVisitor, "source" | "campaign" | "qr">): string {
  if (!visitor.source && !visitor.qr) return "Sin origen (link sin etiqueta)";
  const base = visitor.source ? (SOURCE_LABELS[visitor.source] ?? visitor.source) : "Código QR";
  const extra = visitor.campaign ?? visitor.qr;
  return extra ? `${base} · ${extra}` : base;
}

/** The day's headline counts, computed from the same feed. */
export function summarizeActivity(visitors: ActivityVisitor[]) {
  const steps = visitors.flatMap((v) => v.steps);
  const count = (names: string[]) => steps.filter((s) => names.includes(s.eventName)).length;
  return {
    people: visitors.length,
    pages: count(["page_view", "landing_view"]),
    buttons: count(["cta_click"]),
    whatsapp: count(["whatsapp_click"]),
    socials: count(["social_click", "outbound_click"]),
    payTaps: count(["checkout_started"]),
    wins: count(["lead_submitted", "purchase", "subscription_started"]),
    bySource: Object.entries(
      visitors.reduce<Record<string, number>>((acc, v) => {
        const key = v.source ? (SOURCE_LABELS[v.source] ?? v.source) : v.qr ? "Código QR" : "Sin origen";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1]),
  };
}
