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

**Block 07.1 (readiness audit) complete.** **Block 07 (first real sale)
started, PAUSADO** — the technical work that doesn't depend on an
external decision is done (below); the work that closes the block with
an actual paid sale is blocked on Decision Gates 1–2 (see
`docs/NEXT_BLOCK.md`).

## What Block 07 shipped so far

- Fixed `/entrenar`: the free-community and Facebook-Subscription cards
  no longer share a CTA id/destination — each has its own, matching the
  "no mezclar ofertas" rule (docs/UNIVERSE_UX.md).
- `b2b_opportunity` has a real writer for the first time —
  `/api/lead` opens one alongside the generic lead when the topic is
  `shows`/`marcas` (`src/server/db/repositories/b2bOpportunity.ts`,
  docs/COMMERCE.md §8).
- Coaching (`Essential`/`Performance`/`Elite`) now has real `offer`
  rows (`purchase_type: 'quote'`, no price invented) instead of zero —
  docs/COMMERCE.md §8.
- `docs/MASTER_BRIEF_BLOCK_07_10.md` persisted as the source-of-truth
  brief for Blocks 07–10.

## What's still open (blocking a real, paid first sale)

- **Decision Gate 1**: real Facebook Subscription URL (`social_profile`
  still has a placeholder — `https://facebook.com/`).
- **Decision Gate 2**: at least one real price + checkout provider
  decision, or an explicit choice to keep Block 07 in "quote" (lead
  capture) mode for its first close.
- Decision Gates 3–5 (Block 08/09/10 payment provider, Droppy, email/
  WhatsApp vendor) are informational for now — they don't block Block
  07.

## Tests / production, as of this checkpoint

lint ✅ · typecheck ✅ · unit 98/98 ✅ · integration 75/75 ✅ · build ✅
(all against the local disposable `cbu_test` DB, never the real
Supabase project). Supabase real (`Cristian-Barbosa-UNIVERSE`, ref
`yskfntcurmqqxjuvqoto`) has the 5 migrations + seed applied
(docs/SUPABASE_PRODUCTION.md) — the Block 07 seed additions (coaching
offers) have **not** been applied there yet; that's a data-only insert,
safe to run once Cristian confirms, or alongside whichever Decision Gate
closes first.

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
