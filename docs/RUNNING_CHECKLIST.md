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
  hay que probarla". Updated 2026-08-25: no longer waiting for the
  2026-08-27 school visit — Cristian has people ready to test today.
  He can drive the whole circuit himself right now: visit the site (or
  `/bienvenida/colegio-la-leticia-2026` for the school-attributed
  version — confirmed live in production, see the Closed item below),
  submit the form, then check `/admin/leads`, `/admin/qr`, and
  `/admin/landings` for the real rows. The Colegio de la Leticia visit
  is still the first occasion for *volume*, but isn't the gating event
  for testing the mechanism anymore.
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
- **IA dentro del panel que explica los datos en lenguaje natural**
  (2026-08-25) — Cristian's own idea: ask the dashboard "¿alguien se
  registró hoy?" in plain Spanish instead of reading tables. The
  biggest of the three asks from that message — needs a real Claude/
  Anthropic API integration (new vendor, cost per query) — deliberately
  not started; asked Cristian to prioritize the three together
  (Contactos / mensajes automáticos / esto), he picked Contactos first
  (closed below).
- **Mensajes automáticos (WhatsApp/correo) al registrarse + invitación
  semanal a la comunidad** (2026-08-25) — same message as above. This
  is the same automation item already open since earlier the same day
  (see the entry above about a real automation) — still blocked on
  Decision Gate 5 (vendor choice, docs/NEXT_BLOCK.md). Now that
  `/admin/contactos` exists (closed below), Cristian can already do
  this manually — reach out himself using the real phone/email now
  visible there — while the vendor decision is still open.

## Closed

- **`/admin/contactos` — real name/email/teléfono per registro**
  (2026-08-25): Cristian's own request — "quiero ver esa base de datos
  de esas personas." New page, new `src/server/admin/` module, new
  `/api/admin/contacts` endpoint (session-cookie-only auth, no bearer
  token) — deliberately kept out of the PII-free `/api/analytics/*`
  family. Full record in docs/COMMAND_CENTER.md §17. Verified with a
  real inserted contact+lead row, screenshotted logged-in. Also
  answered separately, same conversation: Cristian's "entré sin
  contraseña" report was investigated in the actual session code
  (`src/proxy.ts`) — an already-valid 12h session cookie skips the
  login form by design (redirects straight to `/admin`), the same way
  any site remembers a logged-in browser; not a real hole unless the
  same skip happens in a browser that never entered the password
  (asked Cristian to check via a private/incognito window — no
  confirmation back yet either way).
- **Dashboard translated fully to Spanish** (2026-08-25): Cristian's
  own words, "no entiendo bien," specifically citing "Lead." Every
  visible string across all 10 (now 11) `/admin/*` sections — full
  record and glossary in docs/COMMAND_CENTER.md §10/§17.
- **Vercel Authentication (SSO) wall was blocking the whole public
  site** (2026-08-25): found while investigating Cristian's "no me pidió
  contraseña" report on `/admin/login` — turned out to be a much bigger,
  separate issue: Vercel's own "Standard Protection" (likely the
  platform's own default for a new project, never something Cristian
  turned on) required a Vercel account login for every `*.vercel.app`
  URL, including the real production one — meaning any real visitor
  without Vercel access, QR scans included, would have hit Vercel's own
  login wall instead of the site. Disabled via the Vercel API,
  confirmed off. Also: `ADMIN_PASSWORD_HASH`/`ADMIN_SESSION_SECRET`
  generated and walked Cristian through pasting them into Vercel's
  env vars + redeploying — `/admin/login` has a real working password
  now (`Barbosa2020-2026`, chosen by Cristian).
- **"Presentaciones pasadas" ready to hold real activity entries**
  (2026-08-25): Cristian asked whether documenting real appearances
  ("ya estuvimos en el colegio de la Leticia... un tipo de noticias")
  was worth doing. Chose reusing `/eventos`'s existing, already-empty
  "Presentaciones pasadas" category over a new "Noticias" route/nav
  entry. `src/app/eventos/page.tsx` now renders a real list from a
  typed `pastPresentations` array when it has entries, same honest
  empty state as before when it doesn't — starts empty on purpose, no
  entry invented ahead of an event that hasn't happened. First real
  candidate: the Colegio de la Leticia visit, 2026-08-27 — add its
  entry (place/date/description) to that array the same day, once
  there's something real to say about it.
- **Command Center: 8/10 sections crashed in production; dwell-time +
  session-duration metrics added** (2026-08-25): Cristian asked to see
  "todo el comportamiento" — de qué QR viene la gente (already worked),
  cuánto tiempo pasan en cada página (didn't exist). While wiring that
  in, found and fixed a real bug: 8 of the dashboard's 10 sections threw
  a Server/Client Component error in production (`next start`/Vercel,
  never caught by `next dev` or `npm run build` alone) — every section
  is fixed and reverified against a real production build now. New:
  average time on page per route (Landings), average session duration
  and pages/session (Overview). Full record in docs/COMMAND_CENTER.md
  §8 and docs/KPI_DEFINITIONS.md.
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
  real production URL. Row confirmed live in the real production
  Supabase project too (Supabase MCP connector became available this
  session; queried it directly, 2026-08-25): `qr_source.slug =
  'colegio-la-leticia-2026'`, `active = true`, `destination_path =
  '/bienvenida/colegio-la-leticia-2026'`, campaign "Colegio de la
  Leticia — Envigado", source "Colegio" — nothing left blocking this.
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
