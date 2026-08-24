# MASTER_BRIEF_BLOCK_08.md — Monetización + experiencia comercial completa

Source-of-truth brief for Block 08, given by Cristian on 2026-08-24.
Persisted per the brief's own §25 instruction. Condensed, structured
record of the brief's substance — the intent below is binding,
verbatim phrasing is not.

## Objective

Block 07 built the first commercial layer. Block 08 must convert the
**whole** Universe into a navigable commercial experience, not just
music — nine departments plus a transversal experience/assets layer:

```
08.0 Experience + assets + navigation audit
08.1 Entrenar / Comunidad / Coaching (improve, don't rebuild)
08.2 Música (build the access architecture, not the song itself)
08.3 Productos digitales
08.4 Productos físicos
08.5 Shows
08.6 Marcas / Sponsors
08.7 Historia
08.8 Eventos
08.9 Redes sociales
```

Model: `UNIVERSE → INTENCIÓN → DEPARTAMENTO → EXPERIENCIA → CTA →
REGISTRO/CRM → CHECKOUT O WHATSAPP → CONVERSIÓN → ANALYTICS → FUTURO
LIFECYCLE`.

## Execution rule

`AUDITORÍA RÁPIDA → CORRECCIONES CRÍTICAS → CONSTRUCCIÓN → TESTS →
PREVIEW → SIGUIENTE FASE`, by checkpoint (A: 08.0+nav+assets; B: 08.1+
08.2; C: 08.3+08.4; D: 08.5+08.6; E: 08.7+08.8+08.9), each checkpoint
leaving the system compiling. A Decision Gate documents a blocked
piece and the phase continues — never pauses the whole block.

Priority order: navegabilidad real → experiencia comercial →
conversión → CRM → analytics → mobile → contenido → visual polish →
3D/motion (last, out of scope for Block 08).

## What actually happened this block

- **Mobile navigation was broken** (`Header`'s nav was `hidden lg:flex`/
  `hidden sm:flex` with zero fallback — only `Footer`'s nav worked on
  phone, requiring a full scroll). Found during the mobile audit §13
  explicitly asked for, fixed with `MobileNav` (a portal-rendered
  full-screen panel — `Header`'s own `backdrop-blur` turns it into a
  CSS containing block for `position:fixed` descendants, so the panel
  has to render outside `header`'s subtree via `createPortal`, not
  inline). Verified with a real headless-browser click, not just "it
  compiles" — confirmed broken before the fix, confirmed fixed after.
- **08.2 música**: no real song exists (title/artwork unconfirmed), so
  no product/offer row was invented. Instead built the one real,
  reusable primitive the brief asked for — `entitlement`
  (`supabase/migrations/0007_entitlement.sql`): confirms a contact has
  access to a specific product after a confirmed purchase, generic
  across song 01/02/03/future digital products, not music-specific.
  Ships as tested, unpopulated infrastructure — nothing calls
  `grantEntitlement()` yet because there's no real purchase flow to
  call it from (Decision Gate 3 still open).
- **08.8 eventos**: restructured into the four categories the brief
  names (eventos propios / participaciones / próximos / presentaciones
  pasadas) as honest empty states — no event invented, no new schema
  (an `event` table would be speculative infrastructure for zero real
  rows — deferred until a real event exists to design against).
- **08.0/18 assets**: `docs/ASSETS.md` — the placeholder convention
  every page already follows, plus the per-department asset checklist
  the brief asked for.
- **08.1, 08.3-08.7, 08.9**: reviewed, found already solid from Block
  07's work (real destinations/prices, WhatsApp comercial CTAs, topic
  splits) — no rebuild, per the brief's own "no reconstruirla,
  mejorarla."

## Decision Gates (unchanged from docs/MASTER_BRIEF_BLOCK_07_10.md)

3. Payment provider for música/productos digitales — still open, blocks
   `entitlement` ever getting a real writer.
4. Droppy API vs. fulfillment manual — still open.
5. Email/WhatsApp automation vendor — deliberately deferred.

## What was explicitly NOT built, on purpose

- No real song/product for música (no title/artwork confirmed).
- No `event` table/CRUD (no real event to design against yet).
- No Droppy integration (Decision Gate 4 unresolved).
- No payment provider connected (Decision Gate 3 unresolved).
- No 3D/heavy motion, no new design system, no charting library.
