# RUNNING_CHECKLIST.md — the live, ongoing list

Not a block deliverable — a running list Cristian asked to keep as
things come up mid-conversation, so nothing said in passing gets lost.
Update this file (add/close items) instead of letting a spoken request
live only in chat history. Newest items at the top of each section.

## Open

- **Probar una automatización real** (2026-08-25) — Cristian wants at
  least one real automation exercised once there's real data flowing
  (not simulated). Blocked on Decision Gate 5 (email/WhatsApp
  automation vendor, docs/NEXT_BLOCK.md) — needs a vendor chosen before
  there's anything to test. Candidate first real trigger once chosen:
  a welcome message/sequence fired off `lead_submitted` from the
  `/bienvenida/[slug]` landing (docs/ATTRIBUTION.md, "QR that lands on
  a personalized page").
- **Probar la base de datos con datos reales, no solo seed** —
  Cristian's own words: "una vez empecemos a construir base de datos,
  hay que probarla" once real people (not test rows) start writing to
  it. First real occasion: the Colegio de la Leticia — Envigado visit
  (2026-08-27) — the `/bienvenida/colegio-la-leticia-2026` leads that
  land that day are the first real, non-test data through this exact
  path. Check `/admin/leads` and `/admin/social` after the visit to
  confirm real rows, real attribution, no surprises.
- **Assets reales de Cristian** — fotos, imágenes, logos "para
  perfeccionar la página" (2026-08-25), to be sent over time. Tracked
  per-category in docs/ASSETS_AND_BRAND.md — update that file's
  REAL/PENDIENTE/PLACEHOLDER column as each one arrives, don't just
  drop files in without updating the tracker.
- **Favicon** — currently the default Next.js/Vercel starter icon
  (docs/ASSETS_AND_BRAND.md category 2, "Logo secundario"). Swap once
  a real icon/logo exists. Zero dependency on hosting — a same-day fix
  whenever the asset is ready.
- **Visual/brand identity pass** — Cristian's own framing (2026-08-25):
  "empezar a trabajar arquitectura visual" is the phase after this
  point, before automations/strategy. No specific brief yet — next
  session should ask what to change first, or start from the concrete
  finding already on record (`/redes` grouped by category,
  docs/UNIVERSE_UX.md §8).

## Closed

- **Colegio de la Leticia — Envigado — QR landing for the 2026-08-27 visit**
  (2026-08-25): `src/app/bienvenida/[slug]/page.tsx` (new, reusable for
  any future school/event QR), `src/server/db/repositories/qrSource.ts`
  (new read model), `campaign`/`qr_source` rows for
  `colegio-la-leticia-2026`. Verified end to end locally: a real
  `ContactForm` submission through this exact URL (with the real
  QR's utm params) produced a `lead`/`contact` correctly attributed to
  `source=school`, `campaign=Colegio de la Leticia — Envigado`,
  `qr=colegio-la-leticia-2026` — confirmed by querying the database
  directly, not assumed. QR image generated
  (`qr-colegio-la-leticia-2026.png`, sent to Cristian) encoding the
  real production URL. **Still needed**: the same `campaign`/`qr_source`
  rows written to the real production Supabase project (blocked on the
  Supabase MCP connector being enabled for this chat session — see this
  file's git history / ask the active session for current status if
  picking this up later).
- **Google AdSense — evaluated, not added** (2026-08-25): documented in
  docs/ARCHITECTURE.md §11 addendum. Competes with this site's actual
  monetization model; not revisited unless that model changes.
- **20-point public web-security checklist audit** (2026-08-25): 19/20
  already held; `/api/checkout`/`/api/track` missing rate limits was
  the one real gap, closed same day. Full record in docs/SECURITY.md.
- **Vercel public preview + DATABASE_URL/NEXT_PUBLIC_SITE_URL blank-env
  bugs** (2026-08-25): site live at
  `cristian-barbosa-universe.vercel.app`, both real build failures
  found via the Vercel MCP connector's actual logs and fixed. Full
  record in docs/PROJECT_STATE.md.
