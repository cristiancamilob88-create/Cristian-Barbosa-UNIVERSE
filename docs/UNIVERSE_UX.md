# UNIVERSE_UX.md — Block 04.2: public UX + conversion architecture

The public site's job, stated plainly by the brief this block executed:
a visitor should be able to answer "¿qué puedo hacer aquí con Cristian
Barbosa?" quickly, and every answer needs a clear route to act on it —
**DESCUBRIR → ELEGIR → CONOCER → CONVERTIRSE EN PARTE DEL ECOSISTEMA.**
This is a content/navigation/tracking pass, not a redesign: no new
routes, no new visual system, no schema change — see docs/ARCHITECTURE.md
§8 for the token system this still uses verbatim.

## 1. Architecture of intentions

Every commercial route in `src/config/site.ts`'s `navItems`/
`secondaryNavItems` gained two fields:

```ts
interface NavItem {
  // ...existing tag/label/href/description, unchanged...
  intent: string;    // "Quiero entrenar" — the actual CTA text
  intentId: string;  // "intent_training" — the cta_click.cta id
}
```

`label` (short, used in Header/Footer nav chrome) and `intent` (the
full first-person phrase, used as CTA button text on the homepage hub
and as bridge links elsewhere — `/about`'s "Sigue explorando" section)
are deliberately two different fields: a nav bar reading "Quiero
entrenar / Quiero entrar a la comunidad / Quiero escuchar su música..."
across eight items would be nav clutter, but a homepage hub card should
say the exact thing the visitor is about to do. Both read from the same
one row per route — `site.ts` stays the single source of truth
(AGENTS.md), nothing hardcodes a route path or its intent phrase a
second time.

Cristian Barbosa Universe's own site is deliberately NOT built as a
Linktree: the homepage is a proper hub section (hero + ticker + one grid
of eight intention cards, docs/ARCHITECTURE.md §8's existing signature
elements), not a bare list of links — see §7 below for why this
boundary was picked deliberately, not by default.

## 2. The intention → CTA map (approved copy)

| Intention | CTA text | Route | `intentId` |
|---|---|---|---|
| Train | "Quiero entrenar" | `/entrenar` | `intent_training` |
| Free community | "Quiero entrar a la comunidad" | `/comunidad` | `intent_community` |
| Digital course | "Quiero aprender calistenia" | `/productos` (via `/entrenar`) | `intent_training_course` |
| Premium coaching | "Quiero entrenar personalmente con Cristian" | `/contacto?topic=coaching` | `intent_training_coaching` |
| Music | "Quiero escuchar su música" | `/musica` | `intent_music` |
| Music early access | "Quiero escucharla antes que nadie" | `/contacto?topic=musica` | `intent_music_early_access` |
| Products | "Quiero ver los productos" | `/productos` | `intent_products` |
| Shows | "Quiero contratar un show" | `/shows` → `/contacto?topic=shows` | `intent_shows` |
| Shows (secondary) | "Quiero hablar con Cristian" | `/shows` → WhatsApp (`GoLink`) | n/a — social/whatsapp click, not `cta_click` |
| Brands | "Quiero trabajar con Cristian" | `/marcas` → `/contacto?topic=marcas` | `intent_brands` |
| Story | "Quiero conocer su historia" | `/about` | `intent_story` |
| Social | "Quiero seguir a Cristian" | `/redes` | `intent_social` |

"Quiero ser parte" is explicitly never used anywhere (too ambiguous —
the brief's own instruction) — enforced by `src/config/site.test.ts`,
which fails if any `intent` phrase ever contains that string, and
asserts every `intentId` is unique and matches `intent_[a-z_]+`.

## 3. Per-pillar changes

- **`/entrenar`**: four distinct groups, never blended (per the brief's
  own "no mezclar las cuatro ofertas como si fueran el mismo producto"):
  free WhatsApp community, Facebook Subscription, the digital course,
  and premium coaching (still naming its three tiers — Essential/
  Performance/Elite — in the card's own copy, just not as three
  separate top-level cards anymore). Each card is now a `TrackedLink`
  (previously a plain, untracked `Link`) with its own `cta_click.cta` id.
  **Block 07 fix** (docs/MASTER_BRIEF_BLOCK_07_10.md): the free
  community and Facebook Subscription cards used to share both the same
  `intentId` (`intent_community`) and the same destination
  (`/comunidad`) — the "no mezclar" rule wasn't actually satisfied for
  those two. The Facebook Subscription card now `GoLink`s straight to
  the `facebook-subscription` slug (measured server-side as its own
  `social_click`, distinguishable by slug), matching how `/comunidad`
  itself already told the two apart.
- **`/comunidad`**: the WhatsApp `GoLink`'s button text is now "Quiero
  entrar a la comunidad" — the Facebook Subscription card keeps its own
  distinct framing ("Entrena con Cristian Barbosa") right next to it,
  so a visitor never mistakes one offer for the other.
- **`/musica`**: previously had no CTA at all (three static content
  blocks, zero links). Now has "Quiero escucharla antes que nadie" →
  `/contacto?topic=musica` (a lead-capture entry point tied to the
  existing `music-launch` campaign via whatever UTM/QR the visitor
  actually arrived with — nothing hardcodes that campaign here) and
  "Quiero seguir a Cristian" → `/redes`. No purchase/streaming link was
  invented — none exists yet (`social_profile` has no music platform row
  — see §6).
- **`/productos`**: kept its physical/digital split, added a CTA per
  block. Both currently point at `/contacto?topic=productos` (lead
  capture, not checkout) — no live purchase flow exists yet; see
  docs/COMMERCE.md (Block 05) for the catalog/checkout infrastructure
  this connects to once real offers exist.
- **`/shows`**: primary CTA text changed from the generic "Solicitar
  información" to the brief's own approved "Quiero contratar un show";
  added the secondary "Quiero hablar con Cristian" as a direct WhatsApp
  `GoLink` (reusing the one WhatsApp channel that exists — no new
  number/link invented) instead of a second form.
- **`/marcas`**: CTA renamed "Hablemos de tu marca" → "Quiero trabajar
  con Cristian"; added the brief's own offering list (sponsorship,
  partnerships, campañas, contenido, activaciones, colaboraciones,
  eventos, oportunidades comerciales) as a visible tag list, same
  pattern `/shows`' "Para quién" already used.
- **`/about`**: unchanged narrative section (copy is still pending final
  writing — Product Vision's own instruction not to invent Cristian's
  personal history). Added the bridge section the brief asked for
  ("debe existir un puente hacia las demás experiencias") — four
  `TrackedLink`s pulled directly from `navItems` (Entrenar/Música/
  Shows/Redes), never a separate hardcoded list.
- **`/redes`**: unchanged — it already *is* the "Quiero seguir a
  Cristian" destination, listing every active `social_profile` row
  through `GoLink` (docs/SOCIAL_ROUTING.md). No page here needed new
  copy; `/musica` and `/about` now link to it using that exact intent
  phrase.
- **Homepage**: hero copy rewritten to name Cristian's actual
  dimensions (atleta/artista/entrenador — the ticker word list now also
  reads ATLETA/ARTISTA/ENTRENADOR/MÚSICO/PERFORMER/COMUNIDAD/EMPRESARIO
  instead of only pillar names like CALISTENIA/COACHING) without
  overclaiming ones the brief didn't ask for (no "actor", no invented
  credential). The pillar grid's heading changed from the generic
  "Explora el universo" to the literal question the brief poses,
  "¿Qué quieres hacer?", and each card now renders `item.intent` as its
  headline instead of the shorter `item.label` — the same underlying
  `navItems` array, framed as an action instead of a category.

## 4. Tracking

No new `interaction.event_name` — every intention above fires the
existing `cta_click` event (`TrackedLink`, `src/components/ui/TrackedLink.tsx`)
with a semantic `cta` id from the table in §2 ("no crear eventos
redundantes"). `GoLink`-based CTAs (WhatsApp, Facebook, the `/redes`
list) are unchanged: they're measured server-side as `whatsapp_click`/
`social_click` via `/go/[slug]` (docs/SOCIAL_ROUTING.md) — this block
only changed their button *text*, not their tracking mechanism, since
that mechanism already correctly measures "Universe → click → redirect
→ destination" per platform/slug.

`page_view`/`landing_view`, `lead_submitted`, `interest_selected`,
`outbound_click`, `product_view`, `offer_view` are all unchanged and
already fire from the places they did before this block (PageViewTracker,
`/api/lead`, `/go/[slug]`, the entity-tagged interaction rows reserved
in Block 03) — nothing here needed a new one.

## 5. Audience journey — unchanged, verified

The brief asked this block to confirm Aura never became a hardcoded
structural category. It already hadn't, and still doesn't: `aura-2026`
is one row in the `campaign` table plus one row in `qr_source`
(`supabase/seed.sql`) — no file under `src/app/` or `src/components/`
names "Aura" anywhere. Any future physical/QR campaign (a show, a
school, a university) is the same pattern: a `campaign` + `qr_source`
row, zero new code. Facebook/TikTok/Instagram/YouTube/Google/QR/
WhatsApp/Eventos/Shows/Colegios/Universidades/external links/paid
campaigns all already flow through the same
`Universe → intención (cta_click) → landing → lead → oferta → compra`
path this block's CTAs now measure end to end.

## 6. What was NOT implemented, on purpose

- No music streaming/purchase link — `social_profile` has no music
  platform row yet (no Spotify/Apple Music account registered); adding
  a fake one would be inventing an integration. `/musica`'s CTAs both
  route to existing, real destinations (`/contacto`, `/redes`). **Still
  true after Block 07** — a real per-song price now exists (§7 below),
  but no purchasable song identity was invented.
- ~~No per-product-type lead topic~~ — **done in Block 07**, see §7.
- No sticky/global "primary CTA" in the Header — the brief didn't ask
  for one, and adding one risks exactly the "convertir el universo en
  un simple Linktree" the brief explicitly warned against.
- No visual redesign, no new imagery, no motion beyond what already
  existed (the ticker) — this block is copy, links, and tracking, per
  its own "no sacrificar arquitectura por estética" instruction (carried
  over from Block 04.1's scope note).

## 7. Block 07 — real destinations, real prices, every pillar touched

Cristian's own brief (docs/MASTER_BRIEF_BLOCK_07_10.md) gave real
channel URLs and prices for the first time — this section records what
changed pillar by pillar, beyond the `/entrenar` CTA-differentiation fix
already documented in §3.

- **`/entrenar`**: Facebook Subscription now shows its real price
  (29.900 COP/mes) and routes through `CheckoutLink` (docs/COMMERCE.md
  §9) instead of a bare `GoLink`. Coaching gained a real 3-tier price
  breakdown (Essential/Performance/Elite) and its single CTA now `GoLink`s
  straight to the commercial WhatsApp number — no more `/contacto?topic=coaching`.
- **`/comunidad`**: gained a third block, Instagram Comunidad (a real,
  distinct account from Cristian's main Instagram) — the page now
  explicitly separates all three community entry points instead of two.
  Facebook Subscription's card matches `/entrenar`'s new
  `CheckoutLink`/price treatment.
- **`/musica`**: added the confirmed price model (10.000 COP por
  canción) as informational commercial framing — no purchase flow, no
  invented song identity (§6).
- **`/productos`**: the physical block gained a `GoLink` to the
  commercial WhatsApp number alongside its existing lead-capture CTA
  (matching `/shows`'/`/marcas`' established dual-CTA pattern). Both
  CTAs' topic values changed from the generic `productos` to
  `productos_fisicos`/`productos_digitales` (docs/CRM.md).
- **`/shows`**: the audience-segment list expanded to match Cristian's
  real list (added Ferias, Quince años, Rooftops, Eventos masivos,
  Circo/espectáculos); added a "formatos de partida" section (Corporativo,
  Productoras/festivales, Colegios, Eventos privados, Rooftops/venues) —
  starting points for a commercial conversation, not fixed/priced
  packages, per the brief's own "no crear 15 PDFs ahora." **Bug fixed**:
  the secondary WhatsApp CTA was pointing at `whatsappCommunity` (the
  free community chat) — now correctly points at `whatsappCommercial`.
- **`/marcas`**: offerings list expanded (added Embajador, Fitness/
  lifestyle); added a confirmed-ambassadorships section (Club Nativos,
  Expo Fitness — a real fact Cristian gave directly, no metric/result
  invented); gained a secondary `GoLink` to the commercial WhatsApp
  number alongside its existing lead-capture CTA.
- **`/about`**: restructured from one narrative paragraph into a
  themed grid (historia/evolución/calistenia/trayectoria/competencias/
  música/shows/comunidad/visión/proyectos) — structure only, every
  theme's copy stays an honest "contenido pendiente" placeholder where
  no real biographical detail exists yet. Added a press mention (El
  Colombiano — confirmed directly, no article URL/date/title invented)
  with a "press kit próximamente" placeholder. Bridge links expanded
  from 4 routes to all 8 commercial pillars (`/entrenar`, `/comunidad`,
  `/musica`, `/productos`, `/shows`, `/marcas`, `/eventos`, `/redes`),
  still pulled straight from `navItems` — never a second hardcoded list.
- **`/eventos`**: still no fabricated event (none exists yet) — gained
  a bridge section ("¿quieres algo similar?" → `/shows`), the one
  commercial purpose the brief names that doesn't require inventing a
  date/venue.
- **`/redes`**: unchanged code — automatically renders every new
  `social_profile` row seeded this block (tiktok-secondary,
  instagram-community, facebook-main/secondary, x-main,
  whatsapp-commercial) since it already queries the table directly with
  no hardcoded list (docs/SOCIAL_ROUTING.md).
- **New `goLinks` entries** (`src/config/site.ts`): `whatsappCommercial`,
  `instagramCommunity`, `tiktokSecondary`, `x`, `facebook`,
  `facebookSecondary` — real destinations, all confirmed directly, none
  invented. `x-main` needed `supabase/migrations/0006_social_platform_twitter.sql`
  (additive, same pattern as 0005's `product_kind_check` extension) —
  `social_profile.platform` didn't have a `twitter` value yet.
