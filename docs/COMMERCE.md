# COMMERCE.md — Block 05: commerce, offers, conversion infrastructure

Goal, in the brief's own words: go from "sabemos que alguien vio algo"
to "sabemos qué oferta vio, qué hizo, qué compró y de dónde vino" —
**without** integrating a real payment provider (no credentials exist).
This block reviews Block 02's existing commerce schema, extends it
additively, and builds the checkout *abstraction* real providers will
plug into later — it does not process a single real transaction.

## 1. Model review — what already existed, what changed

`product`, `offer`, `orders`, `order_items`, `subscription`,
`b2b_opportunity` were all designed in Block 02
(`supabase/migrations/0001_init_schema.sql`) as catalog/read shape,
explicitly "no payment processing in this block." Reviewed table by
table before writing `0005_commerce_infrastructure.sql`:

| Table | Verdict |
|---|---|
| `product` | Kept, extended additively (§2) — asset-level catalog was already the right shape. |
| `offer` | Kept, extended additively (§3) — commercial-presentation-of-a-product was already the right shape; it was just missing the checkout abstraction's own columns. |
| `orders` / `order_items` | Unchanged — `external_provider`/`external_order_id` already exist on `orders`, which is exactly the hook a real provider integration needs. Nothing to add until a provider is actually connected. |
| `subscription` | Unchanged — `provider`/`external_subscription_id`/`status` already cover the lifecycle this block needs (see §5). |
| `b2b_opportunity` | Unchanged — already models Shows/Marcas as a B2B pipeline with `stage`, exactly matching the brief's "Shows/Marcas = servicio B2B" framing. |

No table was duplicated, renamed, or dropped — the brief's own "no crear
tablas duplicadas" instruction, and confirmed safe because (checked
before writing the migration) no application code anywhere under `src/`
referenced `product.kind` or the `subscription` table at all yet — this
migration is the first time either becomes load-bearing.

## 2. Product catalog

`0005_commerce_infrastructure.sql` added, all nullable/additive:

- `description text`, `image_url text` — catalog presentation fields the
  brief asked for ("nombre, slug, descripción, tipo, imagen, estado,
  categoría, precio base" — `name`/`slug`/`active` already existed).
- `base_price_cents integer` — a reference/base price at the product
  level. **Not** the selling price — that stays on `offer.price_cents`
  (already nullable, "no inventar precios" — Block 02's own decision,
  unchanged). A product can exist in the catalog before pricing is
  decided; an offer can exist before its own price is decided too.

**"Tipo" and "categoría" were treated as the same dimension** —
`product.kind` — rather than adding a second column. The brief's own
"TIPOS DE PRODUCTO" list (digital/physical/music/community/coaching/
service/show/partnership) reads as one taxonomy under two names in two
different sections of the same brief; a `category` column duplicating
`kind` would be exactly the kind of redundant dimension the "no crear
tablas duplicadas" / "no inventar reglas comerciales" instructions
argue against.

### Product kind taxonomy

`product_kind_check` now allows: `physical`, `digital`, `subscription`,
`coaching`, `show` (Block 02's original five) plus `music`, `community`,
`service`, `partnership` (the brief's additions). `subscription` and
`community` **both** exist on purpose — Block 02 named the Facebook
Subscription product by mechanism (`subscription`), the brief names this
dimension by offering type (`community`). Rather than rewrite the
already-seeded `facebook-subscription` product row (a data migration
with no functional benefit — nothing reads `kind` yet), both values stay
valid; new community-type products should prefer `community` going
forward. This is exactly "categorías configurables... no hardcodear
reglas comerciales que dificulten futuras categorías" — extending the
`check` constraint is the whole mechanism for adding a category, now and
later.

## 3. Offers and the checkout abstraction

The brief's own diagram: `offer → checkout → order → order_items →
attribution → analytics`. `orders`/`order_items`/attribution/analytics
already existed (Block 02/03); this block builds `offer → checkout`.

`0005_commerce_infrastructure.sql` added to `offer`:

| Column | Purpose |
|---|---|
| `checkout_provider` | `'internal' \| 'hotmart' \| 'stripe' \| 'mercadopago' \| 'manual' \| 'unavailable'` (default `'unavailable'`). Which system, if any, actually processes this offer's payment. |
| `checkout_url` | The external provider's checkout URL, when `checkout_provider` is an external one. |
| `purchase_type` | `'one_time' \| 'recurring' \| 'quote'` (default `'one_time'`) — recurring is subscription-style (Facebook Subscription); quote is no-fixed-price (a B2B show, high-ticket coaching) and always resolves to a lead-capture flow regardless of `checkout_provider`. |
| `cta_label` | The exact button text this offer should render — ties an offer to Block 04.2's intent-phrase convention (docs/UNIVERSE_UX.md) without hardcoding commercial copy in a page component. |
| `metadata` | `jsonb`, default `{}` — bonus items, installment info, anything provider-specific, without another schema migration per detail. |

### The decision point: `resolveCheckoutDestination()`

`src/server/commerce/checkout.ts` — a pure function, no DB, no network:

```ts
resolveCheckoutDestination(offer, contactTopic?): { kind: "external" | "quote" | "unavailable"; url: string }
```

- Inactive offer, or `purchase_type = 'quote'`, or `checkout_provider`
  is `'unavailable'`/`'internal'` (no real checkout exists for either
  yet) → `quote`: routes to `/contacto?topic=...&offer=<slug>`, a real,
  working lead-capture flow using the `/api/lead` pipeline that already
  exists.
- A real external provider **and** a `checkout_url` are both set →
  `external`: the offer's own checkout URL, unchanged.
- A provider is set but `checkout_url` is empty (misconfiguration) →
  `unavailable`, same safe fallback as inactive — never a broken link.

**Why three outcomes and not a stub that always fails**: every offer in
the catalog today resolves to something real and useful (a working lead
form) even with zero payment integration connected. When Hotmart/Stripe/
Mercado Pago/a first-party checkout eventually exists, wiring it in is
setting `checkout_provider`/`checkout_url` on existing `offer` rows —
never touching this function's callers.

### The route: `GET /api/checkout/[offerSlug]`

`src/app/api/checkout/[offerSlug]/route.ts` — same shape as `/go/[slug]`
(docs/SOCIAL_ROUTING.md): resolves the offer, records `checkout_started`
server-side (attributed to the offer via `entity_type`/`entity_id`,
Block 03's polymorphic reference — this is the first real writer of
those columns), then 307-redirects to whatever
`resolveCheckoutDestination()` decided. Tracking never blocks the
redirect (same try/catch-and-redirect-anyway pattern as `/go/[slug]`).

`CheckoutLink` (`src/components/ui/CheckoutLink.tsx`) is the plain `<a>`
(not `next/link`, same prefetch-inflation reasoning as `GoLink`) a
future "buy" button points at.

### What's not wired yet

No page links to `/api/checkout/[offerSlug]` yet — there is no product/
offer detail page in this app yet for a "buy" button to live on (the
current `/productos` page is two static catalog blocks, unchanged by
this block — see docs/UNIVERSE_UX.md). The route, the abstraction, and
`CheckoutLink` are real, tested infrastructure ready for whichever block
builds that first real product page.

## 4. `visitor → contact → lead → customer`

The brief asked this distinction stay explicit — it already was, just
not named end to end in one place:

```
visitor            src/server/db/repositories/visitor.ts — anonymous, cb_visitor cookie
  ↓ (identified via a form)
contact            src/server/db/repositories/contact.ts — a known person
  ↓ (submits an ask)
lead                src/server/db/repositories/lead.ts — a qualified ask
  ↓ (views a specific offer)         [offer_view interaction — Block 03]
  ↓ (starts a checkout)              [checkout_started interaction — this block, real writer]
  ↓ (a paid order exists)
customer            NOT a new table — see below
subscription         src/server/db/repositories/... none yet; read via
                     getSubscriptionSummary() (§5)
```

**"Customer" is deliberately not a new table or a `contact.is_customer`
flag** — it's a derived fact (`getCustomerSummary()`,
`src/server/analytics/commerce.ts`: distinct `contact_id`s with a paid
`orders` row) computed from `orders`, same as every other read model in
this app. Adding a stored flag would mean keeping it in sync by hand;
the read model can never drift from the actual order data.

## 5. Subscriptions

`subscription.status` already supported `active`/`paused`/`cancelled`
(Block 02). The brief asked for `subscription_active`/
`subscription_paused`/`subscription_expired` "posteriormente... si
realmente son necesarios" — evaluated and **not added**: no `expired`
state, because (a) no real subscription provider is connected yet to
ever produce that state distinct from `cancelled`, and (b) the existing
three already cover the full lifecycle the schema defined. Revisit only
once a real provider integration needs to distinguish "the customer
cancelled" from "the subscription lapsed on its own."

`getSubscriptionSummary()` (`src/server/analytics/commerce.ts`) is the
first read model ever to query `subscription` — nothing wrote to or
read this table before this block. Exposed via `GET
/api/analytics/subscriptions`, and a "Suscripciones" section on
`/admin/revenue` (Command Center).

## 6. Dashboard comercial — read models reviewed against the brief's list

| Brief asks for | Status |
|---|---|
| Ventas por producto/oferta | Already existed (`getRevenueByProductAndOffer()`, Block 03). |
| Revenue | Already existed (`getTotalRevenue()`, Block 03). |
| Conversión | Already existed (ratios on every performance/overview read model, Block 03). |
| Clientes | **New this block** — `getCustomerSummary()` (§4). |
| Suscripciones | **New this block** — `getSubscriptionSummary()` (§5). |
| Ventas por fuente/campaña/QR | Already existed (`getRevenueByDimension()`, Block 03). |
| Ventas por landing | **Not built.** No read model attributes an *order* to a landing page today (only `contact.first_touch_landing_path` exists, and revenue attribution already uses first/last-touch source/campaign/QR, not landing path — adding a fourth revenue dimension is a real new query, deferred rather than squeezed into this already-large block). |
| Ventas por intención | **Not built.** Would need linking a purchase back to the `cta_click.cta` (`intent_*`) that started that visitor's journey — no such link exists in the schema (attribution is source/campaign/medium/QR-based, not CTA-based) and inventing one is a real modeling decision, not a quick addition. Documented here as a genuine gap, not silently skipped. |
| Ventas por canal | Already existed — `source` *is* the channel dimension (docs/COMMAND_CENTER.md, Canales page). |

No metric above was fabricated against empty `orders`/`subscription`
data — every one of these, new or old, returns honest zeros today and
only reports real numbers once real orders/subscriptions exist.

## 7. What was explicitly NOT implemented, on purpose

- No real payment integration (Hotmart, Stripe, Mercado Pago, Meta/
  Facebook) — no credentials exist; connecting one without them was
  explicitly out of scope ("no conectar servicios externos sin
  credenciales reales").
- No product/offer catalog **management** UI — the brief asked to
  "crear una estructura que permita administrar posteriormente," not to
  build that admin CRUD now. Rows are still managed the way every
  dictionary table in this app is: direct SQL / `seed.sql`.
- No revenue-by-landing or revenue-by-intent read model (§6) — named
  gaps, not oversights.
- No CAC/ROAS/CPA/CPL — no real ad spend exists to compute them from
  (unchanged from Block 03/04's own instruction).
- No email/WhatsApp automation — events and interfaces are ready
  (`checkout_started`, `subscription_started`, `subscription_cancelled`
  all already fire/are ready to fire), no external automation platform
  is connected.
- No `subscription_expired` status (§5).
- No new `interaction.event_name` — every event this block's checkout
  flow needed (`checkout_started`) already existed in the taxonomy
  since Block 02; this block is the first real writer of it via a live
  route, not a new event.

## 8. Block 07 — coaching offers + the B2B write path

Two gaps closed by the Block 07.1 audit (docs/MASTER_BRIEF_BLOCK_07_10.md):

- **Coaching offers**: `coaching-essential`/`coaching-performance`/
  `coaching-elite` (products since Block 02) had no `offer` row at all —
  `/entrenar`'s coaching card linked straight to `/contacto`, bypassing
  the checkout abstraction entirely. `supabase/seed.sql` now seeds one
  offer per tier, `purchase_type = 'quote'` (no price invented —
  Decision Gate 2, Block 07.1 audit) — `resolveCheckoutDestination()`
  already treats `quote` as "always resolve to lead capture," which is
  exactly today's real behavior. No page links to these via
  `CheckoutLink` yet (no coaching-tier detail page exists to pick one of
  the three from) — same "infrastructure ready, no page wired" state
  Block 05 left the rest of `offer` in.
- **`b2b_opportunity` write path**: existed since Block 02 with zero
  writer. `/api/lead` now also opens a `b2b_opportunity` row (category
  `shows`/`brands`, `stage` defaulting to `lead`) alongside the generic
  `lead` row when the submitted topic is `shows`/`marcas` — see
  `src/server/db/repositories/b2bOpportunity.ts`. `estimated_value_cents`
  stays null; a contact-form submission never implies a deal size.

## 9. Block 07 — the first real checkout redirect

Cristian confirmed real numbers directly (docs/MASTER_BRIEF_BLOCK_07_10.md):
Facebook Subscription at 29.900 COP/mes, with a real subscribe URL, and
real prices for the three coaching tiers (1.100.000 / 1.600.000 /
2.000.000 COP). Two different resolutions, on purpose:

- **`facebook-subscription-standard`** now has `price_cents: 2990000`,
  `checkout_provider: 'manual'`, `checkout_url` set to the real Facebook
  URL, `purchase_type: 'recurring'`. `/entrenar` and `/comunidad` both
  switched from a bare `GoLink` to `CheckoutLink` for this offer — a
  real `checkout_started` event now fires, attributed to this specific
  offer (`entity_type: 'offer'`), before the 307 redirect to Facebook's
  own subscribe page. `checkout_provider: 'manual'` is accurate, not a
  placeholder: there is no webhook, no automated payment confirmation
  from Facebook (no Meta API integration exists or was assumed to exist
  — docs/MASTER_BRIEF_BLOCK_07_10.md, "07.SEC"), so `orders`/
  `subscription` still have no writer for this offer. A future block
  reconciling subscriptions manually (or via whatever confirmation
  mechanism Cristian sets up on Facebook's side) writes to those tables
  without touching this checkout path at all.
- **Coaching's three tiers** kept `purchase_type: 'quote'` even with
  real prices now known — Cristian's own brief is explicit ("NO
  inventar checkout automatizado para coaching todavía"). `/entrenar`
  shows all three prices for comparison, then a single `GoLink` to the
  commercial WhatsApp number for all three — no per-tier `CheckoutLink`,
  since there's no checkout to link to yet, on purpose.

No new `checkout_provider` enum value was added — `'manual'` already
existed (Block 05) and is the honest description of "a real, priced
offer with no automated payment confirmation," which is exactly what
Facebook Subscription is today.

## 10. Block 06 — Mercado Pago (real payment integration, 2026-09-09)

The gap ARCHITECTURE.md §10 named ("connect a real checkout provider...
first writes to orders/order_items from an actual purchase") — the
`'mercadopago'` `checkout_provider` value already existed in the schema
(Block 05's own enum, unused until now). Cristian's own decision,
walked through directly: Stripe vs. Mercado Pago vs. Nequi/Bancolombia
→ Mercado Pago (he already has a real account); Facebook Subscription
stays exactly as-is (§9) — Mercado Pago is scoped to **one-time
purchases only** (físicos/infoproductos), not a migration of the
$29.900/mes subscription. Dropi (catalog/inventory/shipping for
físicos) is a separate, later integration — see
docs/RUNNING_CHECKLIST.md; nothing here depends on it, since Mercado
Pago only needs a real offer with a real `price_cents`, regardless of
where the product itself is fulfilled from.

**Why a new file, not new columns**: Mercado Pago's Checkout Pro has no
static per-offer URL the way Hotmart/Stripe/manual do — a "preference"
is a one-time, network-created object per checkout attempt (its
`init_point` is the actual pay link). `resolveCheckoutDestination()`
stays pure/sync/no-network (its own doc comment's whole point); the
dynamic preference call lives in
`src/app/api/checkout/[offerSlug]/route.ts` instead, attempted before
falling back to that function's normal (safe) resolution. Plain `fetch`
against Mercado Pago's REST API, same "no new vendor SDK" convention as
`src/server/notifications/whatsapp.ts`'s direct Meta Graph API calls —
see `src/server/commerce/mercadopago.ts`'s own doc comment for the
full shape (preference creation, payment lookup, webhook signature
verification).

**The order-writing path** (`POST /api/webhooks/mercadopago`) is the
first real writer of `orders`/`order_items` in this app. Never trusts
the webhook body's own claimed amount/status — always re-fetches the
payment from Mercado Pago's `/v1/payments/{id}` first. The buyer's
`contact` is created/matched at webhook time from the payer info
Mercado Pago's own hosted checkout collects (email/name/phone) via the
same `findOrCreateContact()` `/api/lead` already uses — no "register
before you can buy" gate, and no guest-checkout placeholder contact
needed. Idempotent by `(external_provider, external_order_id)`: a
retried webhook delivery (Mercado Pago's own documented behavior) never
double-writes an order. Deliberately **not** rate-limited
(docs/SECURITY.md) — its real access control is the webhook signature,
not request volume, and a per-IP limit would risk dropping Mercado
Pago's own legitimate retries.

**What this does NOT do**, on purpose:

- No offer was flipped to `checkout_provider = 'mercadopago'` in
  `seed.sql` — there is still no real físico/infoproducto with a real
  price to attach it to (`/productos` is still two lead-capture blocks,
  `digital-course-standard` still has no `price_cents`). The pipe is
  built, tested, and verified end-to-end against a real HTTP request
  with a real computed signature (fake credentials, since this session
  has none of Cristian's real ones) — attaching it to a real offer is a
  one-row `update offer set checkout_provider = 'mercadopago', ...`
  once Cristian names a real product and price.
- No Mercado Pago subscription (`preapproval`) support — a different
  API from Checkout Pro, not needed since Facebook Subscription isn't
  moving.
- No dedicated post-purchase "gracias por tu compra" page —
  `back_urls` (success/failure/pending) all point at the offer's own
  `landing_path` today. A real confirmation page is a future, separate
  addition.
- No handling of `refunded`/`cancelled` order states from a later
  Mercado Pago webhook event — `orders.status` already supports both
  values (Block 02 schema), only `'paid'` is ever written today.
- **Real end-to-end verification is still pending** — this session
  confirmed the webhook's signature check and fail-safe paths against a
  real HTTP request (fake credentials), and confirmed this environment
  can actually reach `api.mercadopago.com`, but no real payment has ever
  flowed through it. Same posture as the WhatsApp integration's own
  "requires an approved template" gap: treat the first real purchase
  and the first real webhook delivery as the real test, not this one.
