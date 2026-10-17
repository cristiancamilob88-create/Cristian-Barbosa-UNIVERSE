# TRAINING.md — personalized training programs (Plan Diciembre)

Added 2026-09-30, Cristian's own request: students sign up for **Plan
Diciembre** on the site, he approves them, and each student gets their own
weekly routine inside the Universe — check off exercises, leave a note per
day, see their 12 weeks. Cristian sees everyone's week from `/admin/alumnos`.
Built on top of what already existed instead of beside it.

## The flow

```
/entrenar  →  /entrenar/plan-diciembre  (sales page + sign-up form)
                    │  POST /api/lead  topic=plan_diciembre
                    ▼
     contact + lead (interest: coaching) + training_enrollment (pending)
                    │  welcome email/WhatsApp (plan_diciembre templates)
                    ▼
     Cristian: assessment + payment by WhatsApp/Nequi (outside the site)
                    │  /admin/alumnos → "Aprobar y dar acceso" (start date)
                    ▼
     enrollment active + entitlement granted + "ya puedes entrar" email
                    │  (+ "Copiar invitación" / "Enviar por WhatsApp")
                    ▼
     /mi-plan/entrar: email → 6-digit code → session cookie
                    ▼
     /mi-plan (Mi semana) · /mi-plan/plan (Mi plan) — installable PWA
```

Students signed up in person are added from `/admin/alumnos` → "Nuevo
alumno" (optionally approved on the spot).

## Data (migration `0017_training_program.sql`)

| Table | What it holds |
|---|---|
| `training_enrollment` | One contact's run through one program: status (`pending`/`active`/`paused`/`finished`/`cancelled`), goal, level, zone, `start_date` (set on approval), `weeks` (12), `base_routine` (JSON). Unique per contact+product. |
| `routine_template` | Reusable starting routines. `principiante` is seeded (the demo's routine). Copied into the enrollment at sign-up, so editing a template never rewrites an existing student's plan. |
| `training_week_routine` | A week that differs from the base routine. (Written by the phase-2 editor; read already.) |
| `training_log` | Per week + day: `done boolean[]` and `note`. The week's % is computed, never stored. |
| `training_measurement` | Evaluations (pull-ups, dips, plank seconds, weight). Table ready; UI is phase 2. |
| `member_login_code` | HMAC of each emailed sign-in code, expiry, attempts, consumed_at. |

Routine JSON shape: `[{ title, kind, exercises: [{ name, dose, cue }] }]`
(validated by `routineSchema` in `src/lib/training.ts`).

**Reused, not duplicated:** the person is a `contact`; the program is a
`product` (`plan-diciembre`, kind `coaching`) with offer
`plan-diciembre-completo` (quote, 1.000.000 COP); **access is the
`entitlement` row** (0007) — approval grants it, and every `/mi-plan` read
requires it. There is no second access flag.

All six tables have RLS enabled with no policies (deny-by-default), same as
every business table: only the server-only connection reads/writes them.

## Rules (`src/lib/training.ts` — pure, unit-tested)

- Week N = `start_date + 7(N-1)` … `+6`, in **America/Bogota** dates
  (Vercel runs in UTC). Clamped to 1..weeks.
- A week uses its `training_week_routine` row if any, else `base_routine`.
- Standing (Cristian's thresholds): Al día ≥80%, A medias 40–79%, Se está
  quedando <40%; nothing logged = "Sin registros". The student's own "Mi
  plan" shows the week in progress as "En curso" instead of a verdict;
  `/admin/alumnos` shows the real standing.

The student view, the checkbox's optimistic %, and the admin roster all use
these same functions, so they can't disagree.

## Sign-in

- **Email + 6-digit code, no password, no magic link.** A link tapped in
  iOS Mail opens Safari, not the home-screen app, so the session would land
  in the wrong place; a code is typed inside the app.
- **Not Supabase Auth.** This app never talks to Supabase from the browser
  (docs/ARCHITECTURE.md §4, §9); a second client/JWT/`auth.users` mirror
  would be a lot of machinery for "prove you own this inbox."
- Only approved students can get a code (`findEligibleMember`: a started
  enrollment backed by its entitlement). The request endpoint answers
  identically for unknown emails — it can't be used to check who trains
  with Cristian. The one exception: an eligible student whose email failed
  to send gets a real error instead of waiting for a code that never comes.
- Code: `crypto.randomInt`, stored only as HMAC(contact:code) keyed by
  `MEMBER_SESSION_SECRET`; 10-minute expiry, 5 wrong attempts locks it,
  single use, one new code per contact per minute. Plus per-IP rate limits.
- Session: `cb_member_session`, stateless HMAC-signed like the admin cookie
  but with its **own secret** and `sub: "member"` + `cid` (contact id). 60
  days, because students open it from their phone several times a week.
  Revoking access doesn't wait for expiry — every page re-checks the
  enrollment + entitlement in the database.
- Gates: `proxy.ts` (optimistic, cookie only) + `requireMemberContactId()`
  (secure, in the render) — the same two layers as `/admin`.
- **Consent (Ley 1581):** a student added by hand never ticked the form's
  box, so their first sign-in asks for it (`needs_consent`) and records it
  on `contact.data_consent_at`, without burning the code.

Codes and the access email go through the existing Gmail SMTP sender
(`src/server/notifications/email.ts`). **Without `GMAIL_USER`/
`GMAIL_APP_PASSWORD` in Vercel, nobody can sign in.**

## Endpoints

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/lead` (topic `plan_diciembre`) | public | sign-up → lead + pending enrollment |
| `POST /api/member/login/request` | public, rate-limited | email a code |
| `POST /api/member/login/verify` | public, rate-limited | code → session cookie |
| `POST /api/member/logout` | — | clear the cookie |
| `POST /api/member/log` | member cookie | save check-offs/note for one day (always the session's own enrollment, never one from the body) |
| `GET/POST /api/admin/training/enrollments` | admin cookie | roster / add a student |
| `POST /api/admin/training/enrollments/[id]/activate` | admin cookie | approve: active + entitlement + access email |

`/admin/alumnos` follows the Command Center rule: it fetches these
endpoints, never queries Postgres itself. PII lives in
`src/server/admin/training.ts`, not under `analytics/`.

## PWA

`public/mi-plan/manifest.webmanifest` (scope/start_url `/mi-plan`,
standalone) + icons generated from `src/app/icon.png`, linked from
`src/app/mi-plan/layout.tsx`. Scoped to `/mi-plan` so the installed app
opens on the student's week, not the Universe homepage. No service worker
(not needed to install; offline is not a goal yet).

## Environment

- `MEMBER_SESSION_SECRET` (new, ≥32 chars, `openssl rand -hex 32`) — unset
  means student sign-in answers 503 "not configured" (fails closed).
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — already documented; required here.

## Phases

- **Phase 1 (this change):** schema, sign-up, approval, sign-in, Mi semana,
  Mi plan, PWA, admin roster + manual add + WhatsApp invite.
- **Phase 2:** per-week routine editor + "use as base", templates UI
  (Intermedio), measurements + "Mi progreso" with a chart, admin view of a
  student's week.
- **Phase 3:** AI adjustment (Claude API, server-side) suggesting per-exercise
  changes + a WhatsApp message to copy; Cristian decides what to apply.
