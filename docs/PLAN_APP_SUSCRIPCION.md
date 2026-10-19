# PLAN_APP_SUSCRIPCION.md — training app with a paid subscription

Saved 2026-10-19 at Cristian's request ("guarda esa información para hacer
todo esto pronto"). Shareable version (Spanish, with the phases drawing):
https://claude.ai/code/artifact/2d2b0b5e-7e6a-49f2-9785-abd153dbc932

## The idea (Cristian's words, 2026-10-19)

"Cobrar una suscripción para iniciar y que la gente tenga acceso a su
perfil y haga sus publicaciones, mande fotos de su rutina completada
dependiendo su nivel… esto lo podemos pautar en TikTok para que la gente
empiece a entrenar."

Visitor flow: TikTok ad → landing page (video, levels, price) → pays →
profile (email + 6-digit code) → daily routine for their level, timer →
posts a photo of the completed routine → shown on their level's wall →
max tests + progress charts over time.

## What already exists

Branch `origin/feat/app-gratis` (12 commits ahead of production, last
commit 2026-10-07, not merged): free sign-up, /mi-plan (week + plan),
workout timer, max tests with charts, exercise library, /admin/alumnos.
See `docs/TRAINING.md` on that branch.

Production database already has 0017_training_program,
0018_training_results_objective and 0019_exercise_library applied.
**Not applied:** that branch's `0020_free_app_progress.sql` — and 0020 is
now taken by `0020_interaction_map_interaction.sql` (map tracking, applied
2026-10-19). Rename it to `0021_free_app_progress.sql` when merging.

## Phases

1. **Publish what exists** — merge `feat/app-gratis` into production
   (renumber its migration), run unit + integration tests, apply 0021.
   Needs no decision.
2. **Subscription** — monthly price, access only for whoever paid.
   Blocked on: price + payment method.
3. **Profile + wall** — public display name, level, optional photo;
   post a photo of the completed routine; wall per level; Cristian
   approves every photo before it shows; members can report a post.
   Blocked on: who sees posts (members only vs. some public).
4. **TikTok campaign** — landing page + tagged links
   (`utm_source=tiktok&utm_medium=pauta&utm_campaign=app-entrena`);
   the activity panel already measures arrivals → sign-ups → payments.

## Open decisions (Cristian)

- Monthly price, and whether there's a free part (first week or the
  beginner level).
- Payment: start manual (Nequi / payment link + approval in the panel,
  the Plan Diciembre mechanism) and later automatic recurring billing
  (Mercado Pago, his own account; keys only in Vercel env, declared in
  `src/server/env.ts`). See docs/COMMERCE.md — no provider is connected
  yet, and `CheckoutLink` → `/api/checkout/[offerSlug]` stays the only
  way a buy button reaches a provider.
- Who sees posts. Recommended: members only, every photo approved first.
- TikTok pixel: a new analytics vendor — check docs/ARCHITECTURE.md
  §10-11 before adding it; tagged links are enough to measure.

## Non-negotiables

- Minors: sign-up asks for 18+ or an adult's permission (TikTok's
  audience is young and posts include body photos).
- A profile shows only the name the person chooses — never email/phone.
- Separate consent to show photos; people can delete their own posts.
