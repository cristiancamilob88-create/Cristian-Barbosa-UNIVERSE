# ATTRIBUTION.md — first/last touch, QR, visitor→contact linking

## The two layers

**Cookies (edge, `src/proxy.ts`)** — unchanged in spirit from Block 01,
extended in Block 02:

| Cookie | Set when | Contents |
|---|---|---|
| `cb_visitor` | Always, if missing | A UUID — the anonymous identity anchor. |
| `cb_attr_first` | First request that ever carries a utm_*/qr signal | Serialized `SourceRef` — never overwritten once set. |
| `cb_attr_last` | Every request carrying a utm_*/qr signal | Serialized `SourceRef` — replaced every time. |

All three are `httpOnly` (no client JS reads them — server routes read
them from the request) and scoped `path=/`, `sameSite=lax`.

**Database (`visitor`/`contact` tables, `src/server/db/`)** — written
lazily by Node.js route handlers (`/api/lead`, `/api/track`, `/go/[slug]`),
never by the edge proxy (Edge Runtime can't hold a Postgres connection —
see docs/ARCHITECTURE.md §7 for why that split is deliberate, not just
convenient). Every one of those routes starts by calling
`resolveVisitorContext()` (`src/server/db/visitorContext.ts`), which:

1. Reads `cb_visitor` (or mints one if truly absent — see "First-ever
   request" below).
2. Reads `cb_attr_last`, resolves its slugs to `source`/`campaign`/
   `qr_source` ids (`resolveTouch`, find-or-create for source/campaign,
   lookup-only for qr — see docs/DATABASE.md). `resolveTouch` resolves
   these three sequentially, not via `Promise.all` — see
   docs/ANALYTICS_ENGINE.md, "Testing", for the concurrency bug that
   fixed.
3. Upserts the `visitor` row: **last-touch always updates; first-touch
   only fills in if it was still null.** This is the actual enforcement
   point — not a convention, a `WHERE first_touch_captured_at IS NULL`
   in the upsert (`recordVisitorTouch`, `src/server/db/repositories/visitor.ts`).
4. Looks up whether this visitor is already linked to a contact
   (`contact_visitor`).

The same `ResolvedTouch` this produces (source/campaign/qr ids plus raw
medium/content/term/referrer) is what every `interaction` row now
snapshots at write time (Block 03, `0003_analytics_engine.sql`) — see
docs/ANALYTICS_ENGINE.md, "Canonical event schema".

## QR codes

A QR's printed/shared URL already encodes normal UTM params
(`utm_medium=qr`) **plus** `?qr=<qr_source.slug>` — the proxy captures
both into the same `SourceRef` (added field: `qrSlug`). The `qr` slug is
resolved to a `qr_source` row (lookup-only, never auto-created — a QR
must be registered ahead of time, see docs/DATABASE.md) at the moment a
route actually needs to write a DB row, not by the edge proxy.

```
QR sticker → https://cristianbarbosa.com/entrenar
             ?utm_source=aura&utm_medium=qr&utm_campaign=aura-2026&qr=aura-2026-main
```

No in-app QR image generator exists yet (still not required — see
Block 01's non-goals, still true, and `/admin/qr` reads `qr_source`
performance but doesn't render codes). `qr_source` rows are inserted
directly (`supabase/seed.sql`). When a printed QR is actually needed
(first real case: `colegio-la-leticia-2026`, docs/RUNNING_CHECKLIST.md),
the image itself was generated ad hoc outside the app (a one-off
script, not a repo feature) — worth promoting to a real `/admin/qr`
"generate" action if this keeps happening per-event rather than once.

### A QR that lands on a personalized page, not just a tracked one

`aura-2026-main`/`show-medellin-2026-main`'s `destination_path` points
at an *existing* commercial route (`/entrenar`, `/shows`) — the QR is
purely an attribution signal on top of a page that already exists.
`colegio-la-leticia-2026` is the first QR whose destination is a
dedicated landing built for exactly this purpose:
`src/app/bienvenida/[slug]/page.tsx`. That route takes the `[slug]`
(same value as `qr_source.slug` by convention), looks up the row's
`campaign.name` for a personalized greeting ("¡Hola, Colegio de la
Leticia — Envigado!"), and offers the same funnel (register via `ContactForm`,
join the WhatsApp community, subscribe on Facebook, or browse the full
site) — reusable for any future school/event QR by adding one
`campaign` + `qr_source` row, no new code. Never added to `navItems`/
sitemap (same precedent as `/go/[slug]`) and marked `noindex` (a
campaign-specific landing isn't meant to rank in search).

## Visitor → contact linking

`contact_visitor` (one row per visitor id, `contact_id` mutable) is the
non-destructive link: when `/api/lead` resolves or creates a contact, it
calls `linkVisitorToContact()`, which

1. Upserts `contact_visitor` (a visitor can only ever point at one
   contact at a time; a contact can have many visitor ids — multiple
   devices).
2. Backfills every `interaction` row for that visitor that didn't have a
   `contact_id` yet — this is what makes "what did this person do before
   we knew who they were" answerable. It never rewrites *what* an
   interaction was, only who it belongs to.

See docs/AUDIENCE_JOURNEY.md for the worked example.

## First-ever request

An edge case worth naming: on a visitor's literal first hit to any
route, `src/proxy.ts` mints and Set-Cookies a `cb_visitor`, but that
`Set-Cookie` doesn't retroactively appear in `request.cookies` for a
route handler processing *that same* request (browsers only send a
cookie back on the *next* request). Every DB-backed route defends against
this itself in `resolveVisitorContext()` (falls back to
`crypto.randomUUID()` and sets its own `cb_visitor` cookie on its
response if none was present) — so a route hit directly, with no prior
page load, still gets a consistent visitor id between what's written to
the DB and what ends up in the browser's cookie jar. The proxy's cookie
in that specific request is simply overwritten by the route's — no data
inconsistency, just one redundant UUID generation on that one request.
