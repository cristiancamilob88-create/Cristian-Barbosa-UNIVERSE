<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cristian Barbosa Universe — project rules

Read `docs/ARCHITECTURE.md` before adding a route, a data model, or an
integration — it records the decisions already made (stack, folder
structure, data/analytics/attribution/security strategy) and the roadmap
order blocks are meant to land in. Don't re-decide something it already
settled without a stated reason.

- New commercial routes are folders under `src/app/`, and their nav
  label/description/order come from `src/config/site.ts` — don't hardcode
  a route path anywhere else (nav, footer, sitemap all read from there).
- Outbound/commercial links use `TrackedLink` (`src/components/ui/`), not
  a bare `<a>`/`<Link>`, so click events stay measurable.
- External input (forms, API routes) is validated with zod before it
  touches application logic — see `src/app/api/lead/route.ts` for the
  pattern (schema, honeypot, rate limit).
- No secrets in this repo. Every env var the app reads is declared in
  `src/lib/env.ts` and documented in `.env.example`.
- Don't add a database, analytics vendor, payment integration, or 3D/heavy
  motion library without checking `docs/ARCHITECTURE.md` §10-11 first —
  several of these are deliberately deferred, not forgotten.
