# ANALYTICS.md — event taxonomy

`src/lib/analytics.ts` defines the `AnalyticsEvent` union below. Every
event exists because it answers one specific, actionable question from
the brief's Analytics/Dashboard sections — this list is deliberately not
"everything that's easy to measure."

| Event | Fired from | Question it answers |
|---|---|---|
| `page_view` | (reserved — App Router navigation, wire on first real sink) | Which pillars get discovered? |
| `cta_click` | Any `TrackedLink` with a commercial intent (coaching tier, "solicitar información") | Which specific CTA gets clicked, on which topic? |
| `whatsapp_click` | Community/footer WhatsApp links | Is WhatsApp actually converting community interest? |
| `social_click` | Footer social links | Which outbound network gets used? |
| `lead_submit` | `ContactForm`, after a successful `/api/lead` response | Did the form actually convert, and on what topic? |
| `checkout_start` | (reserved for Block 04 — commerce) | Funnel drop-off before payment. |
| `purchase` | (reserved for Block 04 — commerce) | Revenue by product. |
| `subscription_start` | (reserved for Block 04 — commerce) | Facebook Subscription conversions, once trackable. |

## Why a `track()` abstraction instead of a vendor SDK directly

No analytics vendor is chosen yet (Product Vision explicitly says not to
invent one). Every call site already uses `track(event)`; adding a real
sink later means implementing `AnalyticsSink` once in
`registerAnalyticsSink()` — no page changes.

## Not built in this block

- No server-side event storage (`/api/events` or a warehouse write).
- No session/visitor ID generation beyond what the attribution cookies
  already provide (see ARCHITECTURE.md §7) — don't add a second ID scheme
  without a concrete need.
- No dashboard UI — this taxonomy is what a future dashboard block reads.
