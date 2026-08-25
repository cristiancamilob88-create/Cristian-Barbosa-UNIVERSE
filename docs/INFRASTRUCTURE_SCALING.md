# INFRASTRUCTURE_SCALING.md — hosting today vs. later

**Status: reference only, nothing here is a decision or a task.** Written
2026-08-25 in response to Cristian's own question ("¿cómo hacen empresas
grandes como Bancolombia, Sony Music, Tesla, McLaren?") so the answer
lives in the repo instead of only in a chat. Revisit this file when a
real trigger (§3) shows up — not before, and not because "we should be
more original," since infrastructure choice has nothing to do with how
original the site's design/code is (both are 100% ours either way —
see §1).

## 1. The one distinction that actually matters

**Every website on the internet runs on someone's server — that part is
never optional.** What varies is *who operates that server* and *how
much of the operational burden you take on yourself*. Three tiers,
increasing control and increasing responsibility:

1. **Fully managed platform** (what this project uses today — Vercel
   for hosting, Supabase for the database). You give it code; it
   handles the server, scaling, HTTPS, security patches, uptime. You
   never touch a machine.
2. **Cloud provider, rented but self-managed** (AWS EC2, Google Cloud
   Compute, Azure VMs — or their managed layers like AWS ECS/RDS).
   You (or an engineer you hire) configure and maintain the servers
   yourself: OS updates, scaling rules, backups, security hardening.
   More control, real operational work.
3. **Own physical/private infrastructure** (a company's own data
   center, or racks in a co-location facility). Only the company's own
   staff touches the hardware. Extremely rare even for large companies
   today — usually reserved for a narrow slice of workloads with a
   specific regulatory or latency reason, not the whole company.

**Important**: none of these three tiers changes whose code, design, or
brand is on the site. That's a separate axis entirely — this project's
design, copy, database schema, and business logic are 100% original and
100% ours under all three tiers. Tier 1 (what we use) is about *who
keeps the server running*, not *who owns what's on it*.

## 2. Where large companies actually sit (general patterns, not this
## project's specific claims about any single company's internals)

- **Banks in Colombia** (Bancolombia and peers): financial regulation
  (Superintendencia Financiera) drives real, specific requirements
  around data handling, auditability, and often data residency — so
  banks typically run a **hybrid** of their own data centers for core
  transactional/regulated systems, plus regulated cloud contracts
  (AWS/Azure/GCP have dedicated financial-compliance offerings) for
  everything else. This is Tier 2/3 territory, driven by law, not by
  "wanting to be original."
- **Large media/entertainment companies** (the Sony Music tier):
  content at that scale (streaming, global distribution) almost always
  runs on major cloud providers (AWS, GCP) under large enterprise
  contracts — Tier 2, at a scale most companies never reach, with
  dedicated infrastructure teams.
- **Engineering-heavy companies** (Tesla, McLaren, and similar):
  typically hybrid — proprietary/sensitive engineering data (vehicle
  telemetry, CAD, simulation, race data) often stays on infrastructure
  they control tightly, while public-facing sites, marketing, and
  less-sensitive workloads commonly run on standard cloud platforms.
  Formula 1 teams in particular are publicly known to partner with
  major cloud/analytics vendors for trackside and simulation
  computing — the exact internal architecture of any one company isn't
  something this project can verify, and isn't needed to answer the
  real question below.

**The pattern across all of them**: the "custom infrastructure" tier
only shows up where there's a *specific* driver — regulation, massive
scale, extreme latency needs, protecting proprietary IP. It is never
adopted just because a company wants its site to feel more "its own."
A bank's mobile app looking distinctly like a bank has nothing to do
with which data center serves the HTTP request.

## 3. What would actually trigger reconsidering Tier 1 for this project

None of these are true today (docs/SUPABASE_PRODUCTION.md, docs/PROJECT_STATE.md
confirm current scale: a personal-brand commercial site, early traffic,
Vercel's free/hobby tier). Revisit when one of these becomes real:

- **Vercel's usage-based cost** (bandwidth, function execution) starts
  exceeding what a dedicated Tier-2 setup would cost at the same
  traffic — this is a number, not a feeling; check the actual Vercel
  billing dashboard against a rough AWS-equivalent estimate before
  deciding anything.
- **Supabase's connection/compute limits** become a real bottleneck
  under sustained traffic (the connection-pooler mitigation in
  docs/SUPABASE_PRODUCTION.md §10 is the first lever, well before
  "leave Supabase" becomes the right call).
- **A specific regulatory requirement appears** — e.g., if this project
  ever directly processes payment card data instead of redirecting to
  a provider (docs/ARCHITECTURE.md §10-11 already defers that
  deliberately), that's a Tier-2/PCI-DSS conversation, not a Tier-1 one.
- **Traffic reaches a scale where a dedicated infrastructure engineer
  is already part of the team anyway** — at that point Tier 2 stops
  being extra operational burden and starts being the natural next
  step, because the staffing to run it already exists.

## 4. What the path looks like, if/when a trigger above is real

Not a plan to execute now — just so "what would this even involve"
isn't a mystery later:

1. **Move the database first, if anything** — Supabase is already
   plain Postgres (docs/ARCHITECTURE.md §4); migrating to a
   self-managed Postgres on AWS RDS or similar is a connection-string
   change, not a rewrite, since this app never uses Supabase-specific
   APIs (no `@supabase/supabase-js`, confirmed in docs/SUPABASE_PRODUCTION.md §1).
2. **Move hosting second** — Next.js runs on any Node.js host; Vercel
   isn't a lock-in in the way a proprietary platform would be. Moving
   to a container on AWS/Fly.io/Railway/a VM is a deployment-config
   change, not an application rewrite.
3. **Add the operational layer Vercel currently gives for free** —
   this is the actual new work: uptime monitoring, log aggregation,
   security patching cadence, backup verification, on-call — none of
   which exists as a task today because Vercel/Supabase absorb it.
4. **Do it incrementally, never as a single cutover** — run the new
   infrastructure in parallel, verify it under real traffic, then
   switch DNS — the same low-risk pattern already used for every
   database migration in this repo (`supabase/migrations/`, always
   additive, never a destructive rewrite).

## 5. Bottom line

Fully managed (Tier 1) is not a lesser or less-original choice — it's
the same tier a huge number of serious, well-funded companies use for
everything that isn't specifically regulated or planet-scale. The
favicon/logo/visual identity question Cristian asked alongside this one
(docs/ASSETS_AND_BRAND.md) is the actually-original part of the site,
and it's unrelated to which company's servers deliver the bytes.
