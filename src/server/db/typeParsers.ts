import pg from "pg";

/**
 * By default node-postgres parses `timestamp`/`timestamptz` columns into
 * JS `Date` objects. Every repository type in this codebase (and every
 * cookie-serialized SourceRef) treats timestamps as ISO strings — mixing
 * the two silently breaks equality checks and JSON serialization. Force
 * both timestamp OIDs to come back as the raw ISO string Postgres already
 * formats them as, everywhere in the process (this mutates a global
 * registry in the `pg` package, so it only needs to run once — called
 * from both src/server/db/pool.ts and the test DB helper).
 */
let configured = false;

export function configurePgTypeParsers(): void {
  if (configured) return;
  configured = true;

  const TIMESTAMP_OID = 1114;
  const TIMESTAMPTZ_OID = 1184;
  const toIsoString = (value: string) => new Date(value).toISOString();

  pg.types.setTypeParser(TIMESTAMP_OID, toIsoString);
  pg.types.setTypeParser(TIMESTAMPTZ_OID, toIsoString);
}
