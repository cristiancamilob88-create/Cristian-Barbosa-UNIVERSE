# PROJECT_STATE.md — living snapshot

Updated at the close of every block's checkpoint. This is the fastest
way for a new session to know where the project actually is — read
this before `docs/MASTER_CHECKLIST.md`/`docs/NEXT_BLOCK.md` for the
narrative, then those two for the itemized state, then
`docs/MASTER_ROADMAP.md` for the full block order.

## Where we are

**Blocks 01–07 complete** (foundation through the Universe-wide real
destinations/prices — see `docs/MASTER_ROADMAP.md` for the full list).
Migrations `0001`–`0006` and the real commercial data are live and
verified on the real Supabase project (`Cristian-Barbosa-UNIVERSE`,
ref `yskfntcurmqqxjuvqoto`).

**Block 08 — CERRADO** (checkpoints A–E all closed). The whole Universe
is now a navigable commercial experience end to end, on desktop and
mobile, for every one of the 9 departments the brief named.

## What Block 08 shipped

- **Real mobile navigation bug fixed** — `Header`'s nav was invisible
  below `lg` with zero fallback (only `Footer`'s nav worked, requiring
  a full-page scroll). New `MobileNav` component (portal-rendered, to
  route around `Header`'s `backdrop-blur` acting as a CSS containing
  block for `position:fixed`) — verified with a real headless-browser
  click before/after, not just "it compiles."
- **`entitlement` table + repository** (`supabase/migrations/0007_entitlement.sql`,
  `src/server/db/repositories/entitlement.ts`) — the "access after a
  confirmed purchase" primitive for música/digital products, generic
  across future songs/products, tested (4 integration tests), applied
  to the real Supabase project and verified live.
- `/eventos` restructured into 4 real categories (propios/
  participaciones/próximos/presentaciones pasadas) — no fabricated
  event, no new `event` table (deferred until a real one exists).
- `/musica` copy updated to reflect the real access model now that
  `entitlement` exists.
- `docs/ASSETS.md` — the media/placeholder convention + per-department
  asset checklist.
- `docs/MASTER_ROADMAP.md`, `docs/MASTER_BRIEF_BLOCK_08.md` — new,
  referenced for the first time by this block's own brief.
- 08.1/08.3–08.7/08.9 reviewed and found already solid from Block 07 —
  no rebuild, per the brief's own "mejorar, no reconstruir."

## What's still open

- Decision Gates 3–5 (payment provider for música/digital products,
  Droppy vs. manual fulfillment, email/WhatsApp vendor) — unchanged,
  informational, don't block Block 08's own close.
- No real song/product exists yet for música (title/artwork
  unconfirmed) — `entitlement` ships unpopulated until one does.
- `schema_migrations` bootstrap on the real project — unchanged gap
  from Block 06.

## Tests / production, as of this checkpoint

lint ✅ · typecheck ✅ · unit 98/98 ✅ · integration 82/82 ✅ (+4 new:
`entitlement` grant/idempotency/scoping/order-linking) · build ✅ — all
against the local disposable `cbu_test` DB. Production Supabase has
migrations `0001`–`0007` applied and verified (`entitlement` confirmed
live: FKs, unique constraint, RLS all correct).

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
