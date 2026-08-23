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
  route to existing, real destinations (`/contacto`, `/redes`).
- No per-product-type lead topic (`productos_fisicos` vs.
  `productos_digitales`) — the `lead.topic_raw`/`interest` vocabulary
  already has `physical_products`/`digital_products` interest slugs
  seeded, but wiring a new `/contacto` topic value through `ContactForm`'s
  schema is exactly the kind of catalog-adjacent change Block 05 (Commerce)
  owns — bundling it here would mean touching the lead intake schema
  twice in two consecutive blocks instead of once, deliberately.
  `/productos` links to the existing generic `productos` topic instead.
- No sticky/global "primary CTA" in the Header — the brief didn't ask
  for one, and adding one risks exactly the "convertir el universo en
  un simple Linktree" the brief explicitly warned against.
- No visual redesign, no new imagery, no motion beyond what already
  existed (the ticker) — this block is copy, links, and tracking, per
  its own "no sacrificar arquitectura por estética" instruction (carried
  over from Block 04.1's scope note).
