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

**Block 08.10 — CERRADO** (public preview + Vercel readiness audit).
Cristian's first Vercel deployment attempt failed; this block audited
the repo against Vercel's requirements (no guessing — code/config
inspected first, per the block's own rule), found and fixed the one
real blocking bug, and documented everything else. See "Estado
detallado" below for the explicit status fields.

## Estado detallado (Block 08.10)

- **PUBLIC PREVIEW**: READY (not DEPLOYED) — the app builds and runs
  correctly with zero env vars configured (the exact state of a fresh
  Vercel import), verified locally end to end. No live
  `https://*.vercel.app` URL exists yet from this session — deploying
  requires Cristian's Vercel dashboard (no Vercel MCP/API/CLI access
  in this session).
- **VERCEL**: FAILED → fix pushed, not yet re-verified against a real
  Vercel build (this session cannot trigger or observe a Vercel
  deployment — no MCP/API access, no PR exists to inspect GitHub-posted
  check runs). Root cause found and fixed: see "What Block 08.10
  shipped" below.
- **SUPABASE**: PRODUCTION READY — unchanged from Block 06/07/08,
  migrations `0001`–`0007` + seed live and verified
  (`docs/SUPABASE_PRODUCTION.md`). No new migration in this block.
- **DOMAIN**: PENDING — explicitly not connected in this block, per
  Cristian's own instruction (sequence is Vercel URL → navigate → fix
  UX → load assets → visual identity → visual optimization → domain).
- **ASSETS**: PENDING — `docs/ASSETS_AND_BRAND.md` (new) documents all
  16 requested categories (REAL/PENDIENTE/PLACEHOLDER); nothing
  uploaded, nothing invented.
- **VISUAL DESIGN**: PENDING — no redesign done; `/redes`'s "flat list"
  issue documented with root cause and improvement path
  (`docs/UNIVERSE_UX.md` §8), not executed.
- **3D**: PENDING — unchanged, deliberately deferred (docs/ARCHITECTURE.md
  §10-11), not touched in this block.

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

## What Block 08.10 shipped

- **Root cause found and fixed**: `getServerEnv()`'s zod schema
  required `DATABASE_URL` (non-optional) even though three real call
  sites (`isValidAdminSessionToken` — every `/admin/*` proxy check;
  `attemptLogin` — the login handler; `requireAnalyticsAuth` — every
  `/api/analytics/*` request) never read that field, so all three
  crashed with an uncaught Zod error whenever `DATABASE_URL` was
  unset — exactly the state of a freshly-imported, zero-env-vars
  Vercel project. Fixed by making it `.optional()` in
  `src/server/env.ts` and moving the real requirement to
  `src/server/db/pool.ts`'s `getPool()`, the one function that
  actually needs it.
- `package.json` gained `"engines": {"node": ">=20.9.0"}`, pinning the
  Node runtime to match Next.js 16.3.2's own declared minimum.
- 4 new regression tests (one per affected call site) proving each
  works correctly with `DATABASE_URL` completely unset; removed the
  identical `beforeAll` workaround all four test files independently
  carried (the tell this was a known, unfixed rough edge).
- Verified end to end with **all** app env vars unset (the exact
  fresh-Vercel-import state): `npm run build` succeeds; the running
  server correctly serves `/` and `/entrenar` (200), redirects
  `/admin` (307, not a crash), renders `/admin/login` (200), and fails
  closed on `/api/analytics/overview` (503, not a crash).
- `docs/ASSETS_AND_BRAND.md` — new, the 16-category asset/brand status
  table (REAL/PENDIENTE/PLACEHOLDER), superset of `docs/ASSETS.md`'s
  per-department checklist.
- `docs/UNIVERSE_UX.md` §8 — new, audits why `/redes` "feels like a
  flat list": `social_profile.category` already exists and is seeded
  correctly (community/social/commercial) but the page never reads it
  — a rendering gap, not a missing column. Documented improvement path
  only, no redesign executed.
- No architecture change, no new vendor, no new migration, no domain
  connection — all explicitly out of scope for this block.

## What's still open

- Decision Gates 3–5 (payment provider for música/digital products,
  Droppy vs. manual fulfillment, email/WhatsApp vendor) — unchanged,
  informational, don't block Block 08's own close.
- No real song/product exists yet for música (title/artwork
  unconfirmed) — `entitlement` ships unpopulated until one does.
- `schema_migrations` bootstrap on the real project — unchanged gap
  from Block 06.
- **The actual Vercel build error was never seen by this session** —
  no Vercel MCP/API/CLI access, and no PR exists on this direct-push
  workflow for GitHub-posted check runs to attach to. The
  `DATABASE_URL` bug is the most plausible concrete cause found by
  static audit (matches "crashes immediately on a fresh project with
  no env vars configured"), not a confirmed match against Cristian's
  literal error text — if the next Vercel attempt still fails, the
  actual build log is the fastest way to close the loop.
- `/redes` grouped-by-category rendering — documented, not built.

## Tests / production, as of this checkpoint

lint ✅ · typecheck ✅ · unit 102/102 ✅ (+4 new, Block 08.10) ·
integration 82/82 ✅ · build ✅ (including a full zero-env-var
build+run smoke test) — all against the local disposable `cbu_test` DB.
Production Supabase has migrations `0001`–`0007` applied and verified
(`entitlement` confirmed live: FKs, unique constraint, RLS all
correct). No new migration in Block 08.10.

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
