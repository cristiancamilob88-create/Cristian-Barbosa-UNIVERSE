# NEXT_BLOCK.md — what happens next, and why

## Immediate next step

**One manual action closes Block 07**: enable the Supabase MCP
connector for this chat session (it's already connected/authorized at
Cristian's account level — this is the same "connected but not
`enabledInChat`" state seen mid-Block-06, just on a fresh chat). Once
enabled:

1. Re-verify project identity (`Cristian-Barbosa-UNIVERSE`, ref
   `yskfntcurmqqxjuvqoto`) before writing anything, same discipline as
   Block 06.
2. Apply `supabase/migrations/0006_social_platform_twitter.sql`.
3. Apply the seed changes in `supabase/seed.sql` from the `-- Block 07`
   comment markers onward (the URL/price UPDATEs and the 6 new
   `social_profile` INSERTs) via `execute_sql` — same DML pattern used
   for the original seed in Block 06.
4. Validate: read back `social_profile` and `offer` and confirm every
   value matches what's now in the repo exactly.
5. Update `docs/SUPABASE_PRODUCTION.md` to reflect the real state.

Nothing else is needed to consider Block 07 closed — the code, the
local validation, and the real commercial data are all already done.

## Why Block 08 shouldn't start yet

Its "access after confirmed payment" mechanism needs Decision Gate 3
(payment provider) settled first — building it against a guess would
risk exactly the rework `docs/MASTER_BRIEF_BLOCK_07_10.md`'s point K
warns about. Música's price model is now confirmed and shown on the
page; what's still missing is the song's own identity (title/artwork),
which is a content decision, not a technical one.

## Open Decision Gates (informational — none block Block 07's close)

1. ~~Facebook Subscription real URL~~ — **CLOSED**, real URL confirmed
   and live in `/entrenar`/`/comunidad`.
2. ~~At least one real price~~ — **CLOSED**, Facebook Subscription +
   all 3 coaching tiers + música's per-song price are all confirmed.
3. Payment provider for music/digital products (Block 08).
4. Droppy vs. manual fulfillment (Block 09).
5. Email/WhatsApp vendor (Block 10) — deliberately not asked yet.

## Recommended order once the Supabase write lands

Close Block 07 (production data confirmed live) → design the Block 08
access/delivery migration once Gate 3's answer arrives (and once the
song's own title/identity is confirmed — a content decision Cristian
still needs to make) → Block 08 implementation → Block 09 (once Gate 4
answered, can run in parallel with Block 08 if Cristian wants both
moving) → Block 10 lifecycle map.
