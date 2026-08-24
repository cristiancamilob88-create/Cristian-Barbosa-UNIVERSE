# MASTER_BRIEF_BLOCK_07_10.md — Revenue Activation + Lifecycle Marketing

Source-of-truth brief for Blocks 07–10, given by Cristian on 2026-08-23.
Persisted here because this file is now part of the mandatory reading
list for every future session touching these blocks — do not treat it
as a one-time chat instruction. This is a condensed, structured record
of the brief's substance, not a verbatim transcript; when in doubt about
exact wording, the intent below is binding, phrasing is not.

## Framing — one system, not four projects

CRISTIAN BARBOSA UNIVERSE is a single HUB (brand + audience + content +
commerce + CRM + analytics + monetization). Blocks 07–10 must be
*planned* together, but *executed and validated* as separate
checkpoints — never advance to the next block until the current one's
checkpoint closes (AUDIT → PLAN → IMPLEMENTATION → TEST → REVIEW →
CHECKPOINT → MEMORY UPDATE).

Conceptual chain: `UNIVERSE HUB → INTENCIÓN → LANDING → OFERTA →
CHECKOUT → CONVERSIÓN → CRM → ATTRIBUTION → ANALYTICS → RETENCIÓN →
ASCENSIÓN/CROSS-SELL`.

Business goal: real sales as fast as possible, without waiting for the
whole site to be visually perfect. Both paths must work: `TRÁFICO →
INTENCIÓN → LANDING → OFERTA → CHECKOUT → PAGO → CRM → ATTRIBUTION →
ANALYTICS → RETENCIÓN → ASCENSIÓN` and `TRÁFICO → INTERÉS → REGISTRO →
SEGMENTACIÓN → LIFECYCLE MARKETING → NUEVA OFERTA → NUEVA COMPRA`.

## Architecture rules restated (not new — already governed by AGENTS.md)

- Landings live inside the Universe, never as independent sites. Both
  `AD → LANDING → CONVERSIÓN` and `AD → HUB → LANDING` must work — paid
  traffic can land directly on any commercial route.
- Routes/intents stay governed by `src/config/site.ts`. `TrackedLink`
  for internal commercial CTAs, `GoLink` for outbound social,
  `CheckoutLink` for purchases. Never a bare `<a>`/`<Link>` for a
  measurable commercial action.
- A landing's priority is its primary conversion, then — not before —
  ecosystem discovery (secondary nav, contextual, not a giant menu).
- Never duplicate Commerce/CRM/Attribution/Analytics/Checkout. Every new
  need (a song, a physical product, an automation) models through the
  existing `PRODUCT + OFFER + CHECKOUT + ORDER (+ ACCESS/DELIVERY when
  needed)` abstraction.

## Block 07 — first real sale (training)

Priority #1. `/entrenar` must be a decision landing separating 4
distinct offers, never blended: free WhatsApp community, Facebook
Subscription ("Entrena con Cristian Barbosa"), digital course, premium
coaching. Each needs its own CTA and tracking — not shared copy/ids.

**Facebook Subscription**: do not invent a Meta API integration, do not
assume Facebook's payment behaves like Stripe. Distinguish: click
toward Facebook (observable) vs. visit to destination (not observable)
vs. confirmed conversion (not observable without real Meta
credentials/API) vs. external conversion we cannot confirm. If only a
public URL exists, use `GoLink`. Anything needing real Meta
credentials/API/permissions → Decision Gate.

## Block 08 — música + productos digitales

Music is a monetization unit, not just content. "Escuchar música" =
intention; "comprar canción" = conversion — never conflate them. Flow:
`/musica → discovery → preview → oferta → comprar → identificación →
checkout → pago → acceso privado → escuchar/descargar → historial →
CRM → attribution → analytics`.

**Music private area**: reuse CRM + Commerce + Order + Analytics —
never a separate music platform. Content release must depend on a
*confirmed* payment, never just on a submitted form. If payment is
manual (Nequi/Bancolombia/etc.), do not auto-release on form submission
alone — needs a reliable confirmation step. If a provider with webhooks
is used (Stripe or similar): validate signature, payload, status,
order, product, buyer — all through zod. Missing provider info →
Decision Gate.

Model every song via the existing Commerce abstraction (`PRODUCT +
OFFER + CHECKOUT + ORDER + ACCESS/DELIVERY`) so it generalizes to EPs,
albums, bundles, exclusive content later — never build a one-song
special case.

**Digital products**: small, fast-to-produce products (calistenia para
principiantes, rutinas, PDFs, programas de 30 días), not a giant course
first. `CONTENIDO GRATUITO → PROBLEMA → PRODUCTO DIGITAL → COMPRA →
ENTREGA → CRM → SIGUIENTE OFERTA`, later `→ COMUNIDAD → COACHING
PREMIUM`. Missing product/price/content/delivery method → Decision Gate.
Do not invent the definitive catalog now.

## Block 09 — productos físicos

`/productos` → real e-commerce unit. Cristian has access to dropshipping
providers, including Droppy — do NOT assume an API integration exists.
First investigate what the system actually needs (catalog, stock,
price, margin, fulfillment, tracking, returns, what can start manual).
Start with few products → validate → data → optimize → scale winners.
Reuse Product/Offer/Checkout/Order/CRM/Attribution/Analytics.

## Block 10 — automations (lifecycle marketing)

Priority order: lead follow-up → post-purchase onboarding → subscription
onboarding → retention → abandoned-checkout recovery (only once
technically reliable) → segmentation by intention/interest → cross-sell
→ re-engagement → lanzamientos → promociones. Design the lifecycle map
first; choose the tool (email/WhatsApp vendor) only after — never add a
vendor speculatively. Consent/preferences must be part of the model
from the start (`CONTACT → INTEREST → CONSENT/PREFERENCES → SEGMENT →
AUTOMATION → MESSAGE → CONVERSION`).

## CRM — own database of interested people, not just buyers

Journey: `VISITOR → CONTACT → LEAD → CUSTOMER → REPEAT CUSTOMER`
(already the existing model — `docs/COMMERCE.md` §4). Capture, where
legally/technically possible: contact/email/phone/intención/interés/
fuente/campaña/landing/oferta/interacciones/compras/suscripciones/
estado/consentimiento. Interest drives future lifecycle segmentation
(entrenamiento → contenido/comunidad/producto/coaching; música →
lanzamientos/canciones/eventos; shows → seguimiento comercial; etc.).
Every capture point should carry source/medium/campaign/intent/
landing/interest when possible.

## Attribution / paid traffic / Command Center

No parallel attribution engine — keep first-touch + last-touch,
UTM/QR/medium/referrer/campaign/content/term exactly as they exist
(docs/ATTRIBUTION.md, docs/ANALYTICS_ENGINE.md). Every commercial
landing must be able to receive paid traffic directly, not only via the
HUB. Command Center evolves by adding pages against existing/new
`/api/analytics/*` endpoints — never a direct Postgres query from
`src/app/admin/`.

## Production

Supabase real is already deployed (Block 06). Before any direct
`npm run db:migrate` against production: resolve the `schema_migrations`
bootstrap gap (docs/SUPABASE_PRODUCTION.md §2/§12) first. Vercel +
production env + domain + checkout provider + webhooks are preparation
items for Block 07 onward, not yet executed — no secret invented, none
committed.

## Later blocks (context only, not in scope yet)

- **Block 11 — paid traffic**: after conversions are validated. CAC/
  CPL/CPA/ROAS only once real ad spend exists — no ad vendor connected
  prematurely.
- **Block 12 — visual/3D polish**: after conversion/UX/mobile/speed/
  checkout/tracking are solid, not before.

## Autonomy and Decision Gates

Full technical autonomy on anything the existing architecture already
determines — no permission needed per file/change. Stop and raise a
**Decision Gate** only for: commercial, financial, legal, irreversible,
credential-dependent, external-provider-dependent, or significant
architecture-change decisions. Never invent: URLs (Facebook
Subscription, social, music delivery, payment), credentials, APIs
(Droppy, Meta), prices, or commercial decisions.

Decision Gate format:
```
# DECISION GATE
1. Decisión necesaria.
2. Por qué bloquea.
3. Opciones.
4. Recomendación.
5. Impacto técnico.
6. Impacto comercial.
7. Información requerida de Cristian.
```

## Report format (per phase/block close)

```
# STATUS
CERRADO / PAUSADO / BLOQUEADO
# OBJETIVO / IMPLEMENTADO / REUTILIZADO / NUEVO / TESTS / PRODUCCIÓN /
# CRM-DATA / ANALYTICS / DECISION GATES / RIESGOS / MEMORIA / SIGUIENTE PASO
```

## Definition of done per block (summary)

- **07**: full funnel evidence (tráfico → landing → CTA → destino/
  checkout → conversión/registro → attribution → analytics), and — only
  where the provider allows automatic confirmation — pago → order/
  subscription → CRM → event → revenue. First real sale is the final
  commercial checkpoint.
- **08**: real digital-product/music experience end to end (discovery →
  offer → purchase → payment confirmation → access/delivery → CRM →
  analytics), extensible to new products without rebuilding Commerce.
- **09**: `PRODUCT → OFFER → CHECKOUT → ORDER → FULFILLMENT → CRM →
  ANALYTICS` with a real, defined fulfillment provider.
- **10**: a correct lifecycle map (`LEAD → SEGMENT → TRIGGER →
  AUTOMATION → MESSAGE → CONVERSION`) with consent/preferences — not
  every provider/automation implemented at once.

## System framing

Not "a website" — the **Cristian Barbosa Revenue OS**. Site = interface,
HUB = center, landings = entry doors, CRM = memory, Attribution = where
people come from, Analytics = what works, Commerce = transactions,
Lifecycle Marketing = data → relationships, Automations = scale,
Content = demand, Offers = revenue, Sales = validation.

## Addendum (2026-08-23) — Block 07 detailed brief: real data, Decision Gates 1–2 closed

Cristian gave a second, more detailed Block 07 brief with real
confirmed data, closing the two Decision Gates the Block 07.1 audit
raised. Recorded here as the source of truth for this data — the
actual live values are in `supabase/seed.sql`/the real Supabase
project; this is the record of *what was confirmed and why*, not a
second copy to keep in sync by hand.

- **Facebook Subscription**: 29.900 COP/mes,
  `https://www.facebook.com/cristianbarbosa201/subscribe/`.
- **Coaching**: Essential 1.100.000 COP, Performance 1.600.000 COP,
  Elite 2.000.000 COP — all three close over WhatsApp comercial with a
  human, explicitly **not** an automated checkout yet.
- **Música**: 10.000 COP por canción (price model confirmed; the
  song's own identity — title, artwork — is not, so no product/offer
  row was created for it).
- **WhatsApp comercial** (shows/coaching/marcas/productos/consultas,
  distinct from the free WhatsApp community):
  `https://wa.me/message/JIT2DR5FHC5TD1`.
- **Every real social channel**: WhatsApp Community, Instagram
  (principal + Comunidad), TikTok (principal + secundaria), YouTube, X,
  Facebook (principal + secundaria + Subscription) — see
  `docs/UNIVERSE_UX.md` §7 for the full list with URLs.
- **Shows**: real segment list (Empresas, Colegios, Ferias, Festivales,
  Productoras, Eventos privados, Quince años, Rooftops, Eventos
  masivos, Circo/espectáculos) + 5 starting "formatos de partida"
  (Corporativo, Productoras/festivales, Colegios, Eventos privados,
  Rooftops/venues) — not fixed/priced packages yet.
- **Marcas**: confirmed ambassadorships — Club Nativos, Expo Fitness.
- **Prensa**: Cristian has been interviewed by El Colombiano — no
  article URL/date/title was given, so none was invented.
- **CRM**: `productos_fisicos`/`productos_digitales` are now real
  `lead`/`interest` topics, replacing the old generic `productos`.

Still explicitly not resolved by this addendum — unchanged Decision
Gates 3–5 (Block 08 payment provider, Block 09 Droppy/manual
fulfillment, Block 10 email/WhatsApp vendor), and the song's own title/
artwork identity for Block 08.
