# SOCIAL_ROUTING.md — `/go/[slug]` and the social profile model

## Two components, two purposes

- **`TrackedLink`** (`src/components/ui/TrackedLink.tsx`) — internal
  commercial CTAs (a coaching tier, "solicitar información"). Fires a
  client-side `track()` call, which POSTs to `/api/track`.
- **`GoLink`** (`src/components/ui/GoLink.tsx`) — outbound social/
  community links. A plain `<a href="/go/<slug>">`, deliberately **not**
  `next/link`: Link prefetches GET requests to routes it can see, which
  for `/go/*` would fire the tracked redirect — and inflate the click
  count — before anyone actually clicks anything.

## `social_profile` vs. `source`

Easy to conflate, kept deliberately separate:

| | `social_profile` | `source` |
|---|---|---|
| Answers | "which account is this" | "how was this visit attributed" |
| Example row | `instagram-main` → `https://instagram.com/...` | `instagram` (category: social) |
| Who writes it | Seeded/managed directly (supabase/seed.sql) | Extensible, find-or-created from utm_source |
| Cardinality | One row per real channel/account | One row per acquisition channel *type* |

A visit attributed to `source=instagram` didn't necessarily come from
clicking a link on the `instagram-main` social_profile — it's whatever
`utm_source=instagram` was on the URL. They're independent dimensions,
same as `source` and `campaign` (see docs/ATTRIBUTION.md).

## `/go/[slug]` request flow (`src/app/go/[slug]/route.ts`)

1. Look up `social_profile` by slug (`getActiveSocialProfileBySlug`) — an
   unknown or inactive slug redirects to `/redes` instead of erroring, so
   a stale printed link degrades gracefully instead of 404ing.
2. `resolveVisitorContext()` (docs/ATTRIBUTION.md) — same attribution
   resolution every DB-backed route uses.
3. Record one `interaction` row: `event_name` is `whatsapp_click` when
   `platform === 'whatsapp'`, `social_click` otherwise — this is the only
   place that distinction is made (everything else about the flow is
   identical across platforms).
4. 307-redirect to `social_profile.url`.

Tracking failure never blocks the redirect (`try/catch` around the DB
work, falling through to the same redirect on error) — a visitor waiting
on a link should never see a broken page because an INSERT failed.

## Single source of truth, precisely

`src/config/site.ts`'s `goLinks` object holds **slugs**, not URLs
(`whatsappCommunity: "whatsapp-community"`). Header/Footer/`/comunidad`
reference these slugs so nav chrome doesn't need a database query on
every page render — but the actual destination URL lives only in
`social_profile.url`, resolved at the moment `/go/<slug>` handles a real
click. That's what "single source of truth" means in practice here: the
identifier is static (cheap, part of the static shell), the destination
is dynamic (one table, one column, changeable without a deploy).

`/redes` (`src/app/redes/page.tsx`) is the one route that queries
`social_profile` directly (`export const dynamic = "force-dynamic"`) —
it's the dedicated page whose entire purpose is presenting the full list,
so the query cost is expected and scoped to that one route.

## What this answers

"How many people who entered from a show clicked Instagram" is now a
query: join `interaction` (event_name = 'social_click', metadata->>
'platform' = 'instagram') to its `source_id`/`campaign_id` attribution
snapshot, filtered to the show's campaign. No dashboard renders this yet
(Block 03) — the data is there to query.
