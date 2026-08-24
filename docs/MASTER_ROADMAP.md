# MASTER_ROADMAP.md — the full block order, top to bottom

The high-level index across every block, from foundation to the
long-term vision. For the *current* stage's detailed brief and
itemized checklist, see `docs/MASTER_BRIEF_BLOCK_07_10.md` +
`docs/MASTER_BRIEF_BLOCK_08.md` and `docs/MASTER_CHECKLIST.md` — this
file is the map, not the territory; don't duplicate their detail here.

**Numbering note (2026-08-24)**: the original `docs/MASTER_BRIEF_BLOCK_07_10.md`
scoped Block 08 to música + productos digitales only, with productos
físicos as a separate Block 09. Cristian's actual, executed Block 08
brief widened it to all 9 departments (including productos físicos) in
one pass — closed as of this update — so there is no longer a
standalone "productos físicos" block; what's left for it is fulfillment
infrastructure (Decision Gate 4), not the commercial experience, which
is already built. Blocks 09–11 below are renumbered accordingly,
cross-checked against the control-center's own independently-updated
roadmap (same renumbering, confirmed 2026-08-24).

| Block | Name | Status |
|---|---|---|
| 01 | Repository audit + technical foundation | ✅ CERRADO |
| 02 | CRM + data + attribution + social routing + audience journey | ✅ CERRADO |
| 03 | Analytics engine + conversion measurement + data read models | ✅ CERRADO |
| 04 | Command Center — admin auth + analytics dashboard | ✅ CERRADO |
| 04.1 | Command Center visual/data layer | ✅ CERRADO |
| 04.2 | Universe UX + conversion architecture | ✅ CERRADO |
| 05 | Commerce/offers/conversion infrastructure | ✅ CERRADO |
| 06 | Real Supabase production deployment | ✅ CERRADO |
| 07 | First real sale (training) + Universe-wide real destinations/prices | ✅ CERRADO |
| 08 | Monetización + experiencia comercial completa (all 9 departments + mobile + assets + `entitlement`) | ✅ CERRADO |
| 09 | Automatización / Lifecycle Marketing | ⏭️ SIGUIENTE |
| 10 | Pauta / Ad Acquisition — tráfico pagado, CAC/CPL/CPA/ROAS | ⏭️ FUTURO |
| 11 | Revenue Optimization — AOV/LTV/retención/cross-sell una vez exista volumen real | ⏭️ FUTURO |
| 12 | Optimización visual / 3D / motion avanzado | ⏭️ FUTURO |

Productos físicos' remaining work (real fulfillment — Droppy vs.
manual, Decision Gate 4) is not a numbered block on its own; it folds
into whichever future session resolves that Decision Gate, since the
commercial experience (`/productos`, WhatsApp comercial CTA) is already
live from Block 08.

## Operating principle

CRISTIAN BARBOSA UNIVERSE is one Revenue OS: a single HUB with
independent commercial departments, all wired to the same CRM,
Attribution, Analytics, and Commerce — never isolated mini-sites. Every
department must be reachable by direct traffic (ads, social, QR) *and*
lead back into the rest of the ecosystem through contextual navigation,
never competing with its own primary conversion:

`TRÁFICO DIRECTO → LANDING/DEPARTAMENTO → INTENCIÓN → OFERTA/CTA →
REGISTRO O CHECKOUT → CRM → ATTRIBUTION → ANALYTICS → SIGUIENTE ACCIÓN`.

## Block 09 preview — Automatización / Lifecycle Marketing

Transform data/interest/registration/purchase behavior into
consent-aware automated follow-up. Initial order: lead follow-up →
onboarding de compra → onboarding de comunidad/suscripción → retención
→ recuperación de checkout (solo cuando sea técnicamente fiable) →
segmentación → cross-sell → reactivación → lanzamientos/promociones.
Design the lifecycle map before choosing a vendor (Decision Gate 5).

## Reading order for a new session

1. `docs/PROJECT_STATE.md` — where we are, right now.
2. `docs/MASTER_CHECKLIST.md` — itemized state of the current stage.
3. `docs/NEXT_BLOCK.md` — the concrete next step.
4. This file — the full order, for context on what comes after.
5. `docs/MASTER_BRIEF_BLOCK_07_10.md` / `docs/MASTER_BRIEF_BLOCK_08.md`
   — the actual briefs, verbatim-substance, for the blocks already run.
6. Whatever block-specific doc the task at hand touches
   (`docs/COMMERCE.md`, `docs/UNIVERSE_UX.md`, etc.).

## Decision Gates carried forward (not resolved by any block above)

3. Payment provider for música/productos digitales (blocks a real
   `entitlement` writer — table built in Block 08, unpopulated).
4. Droppy API vs. fulfillment manual (productos físicos' real
   fulfillment — commercial experience already live).
5. Email/WhatsApp automation vendor (Block 09) — deliberately not
   asked yet, per the brief's own "diseñar el lifecycle primero."

## Memory rule

When state, a decision, a dependency, or the next step changes, update
this file and the relevant checkpoint docs. GitHub is the shared memory
between the control-center and Claude Code sessions.
