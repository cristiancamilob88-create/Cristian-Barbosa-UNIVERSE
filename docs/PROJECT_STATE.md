# PROJECT_STATE.md — living snapshot

Updated at the close of every block's checkpoint (per
docs/MASTER_BRIEF_BLOCK_07_10.md §34). This is the fastest way for a
new session to know where the project actually is — read this before
`docs/MASTER_CHECKLIST.md`/`docs/NEXT_BLOCK.md` for the narrative, then
those two for the itemized state.

## Where we are

**Blocks 01–06 complete** (foundation, CRM/attribution/social routing,
analytics engine, Command Center + its visual layer, Universe UX/
conversion architecture, Commerce/offers infrastructure, real Supabase
production deployment — see `README.md` "Status" for the full list).

**Block 07 — the Universe is now a real, navigable, priced experience,
PAUSADO on one thing only.** Cristian's detailed brief
(docs/MASTER_BRIEF_BLOCK_07_10.md) gave real URLs and prices for
Facebook Subscription, coaching, música, and every social channel —
Decision Gates 1–2 from the Block 07.1 audit are **closed**. Every page
touched by the brief (`/entrenar`, `/comunidad`, `/musica`,
`/productos`, `/shows`, `/marcas`, `/about`, `/eventos`, `/redes`) is
built, tested, and verified working end to end against the local
disposable DB (curl-verified: `/go/[slug]` and
`/api/checkout/facebook-subscription-standard` both redirect to the
real destinations). **The only thing not done**: applying migration
`0006` + the real seed data to the **real** Supabase project — blocked
on the Supabase MCP connector not being enabled for this chat session
(it's connected at account level, just not toggled on here — see
`docs/NEXT_BLOCK.md`).

## What Block 07 shipped

- `/entrenar`: Facebook Subscription shows its real price (29.900
  COP/mes) and routes through `CheckoutLink` (real `checkout_started`
  events now); coaching shows real per-tier prices and routes to the
  commercial WhatsApp number, not `/contacto`.
- `/comunidad`: added Instagram Comunidad as a third real destination;
  Facebook Subscription matches `/entrenar`'s new checkout treatment.
- `/musica`: real price model shown (10.000 COP/canción) — no
  fabricated song/product.
- `/productos`: physical catalog gained a WhatsApp comercial CTA; both
  CTAs' lead topic split into `productos_fisicos`/`productos_digitales`
  (now correctly mapped to their own `interest` rows).
- `/shows`: real segment list + a "formatos de partida" section; fixed
  a real bug (its WhatsApp CTA was pointing at the free community
  number, not the commercial one).
- `/marcas`: expanded offerings + a confirmed-ambassadorships section
  (Club Nativos, Expo Fitness) + a WhatsApp comercial CTA.
- `/about`: restructured into a themed brand-story grid + a press
  mention (El Colombiano) + bridge links to all 8 pillars (was 4).
- `/eventos`: bridge CTA to `/shows` — still no fabricated event.
- `/redes`: automatically picking up every new real channel (no code
  change needed — it already queries `social_profile` directly).
- New migration `0006_social_platform_twitter.sql` (additive —
  `social_profile.platform` gained `'twitter'`).
- `supabase/seed.sql`: real URLs for every previously-placeholder
  channel + 6 new real social profiles + real pricing on
  `facebook-subscription-standard` and the 3 coaching offers.
- Preview screenshots of 8 key pages sent to Cristian; every touched
  route smoke-tested (200) and the two real redirect paths verified
  with `curl` against a running local server, not just "it compiles."

## What's still open

- **Apply `0006` + the seed data changes to the real Supabase project**
  — needs the Supabase MCP connector enabled for this chat (manual
  action, see `docs/NEXT_BLOCK.md`). Everything else about this is
  ready and reviewed.
- Decision Gates 3–5 (Block 08 payment provider, Block 09 Droppy/manual
  fulfillment, Block 10 email/WhatsApp vendor) — informational, don't
  block Block 07's own close.
- `schema_migrations` bootstrap on the real project — unchanged gap
  from Block 06, still not needed until someone runs `db:migrate`
  directly against production.

## Tests / production, as of this checkpoint

lint ✅ · typecheck ✅ · unit 98/98 ✅ · integration 78/78 ✅ (+3 new:
productos_fisicos/digitales interest mapping, retired-topic rejection,
Facebook Subscription real checkout redirect) · build ✅ — all against
the local disposable `cbu_test` DB. Production Supabase still has only
Block 06's state (5 migrations + original seed) — migration `0006` and
the real commercial data are validated locally, pending the connector.

## Multi-agent operating model

Cristian runs a separate "centro de control" session (currently on
ChatGPT, since migrated once already for usage-limit reasons — treat
its identity/platform as changeable, its role as stable) for
strategy/prioritization/checklist-tracking; Claude Code (this
repository's sessions) does the technical execution, taking one block's
brief at a time. **GitHub is the shared source of truth between them**
— both sides read/write these `docs/*` memory files directly, so a
concurrent push from the control-center side (or a second Claude Code
session) is expected, not an error: merge, don't force-overwrite (see
this file's own git history for a worked example, 2026-08-23).

When Cristian pauses a block on a question/dependency/commercial
decision, that should land in these memory docs so the *next* brief
(from either side) already reflects it — never assume a prior
conversation is still available to either agent.
