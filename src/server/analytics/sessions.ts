import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

/** 30 minutes of inactivity starts a new session — the industry-standard default (GA, Amplitude, ...). */
const SESSION_GAP_MINUTES = 30;

export interface SessionSummary {
  sessions: number;
  visitors: number;
  avgPagesPerSession: number;
  avgDurationSeconds: number;
}

/**
 * No stored `session` table (see docs/AUDIENCE_JOURNEY.md, "Why this
 * isn't premature" / DATA_MODEL.md's SESSION row) — a session is
 * computed by gap-sessionizing `interaction` rows per visitor with a
 * SQL window function (`lag()` to find the previous event, a running
 * sum to number sessions), then aggregated. One query, no new table to
 * keep in sync.
 */
export async function getSessionSummary(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<SessionSummary> {
  const { rows } = await db.query<{
    sessions: string;
    visitors: string;
    avg_pages_per_session: string | null;
    avg_duration_seconds: string | null;
  }>(
    `
    with ordered as (
      select visitor_id, created_at,
             lag(created_at) over (partition by visitor_id order by created_at) as prev_created_at
      from interaction
      where created_at between $1 and $2
    ),
    marked as (
      select visitor_id, created_at,
             case
               when prev_created_at is null or created_at - prev_created_at > interval '${SESSION_GAP_MINUTES} minutes'
               then 1 else 0
             end as is_new_session
      from ordered
    ),
    sessionized as (
      select visitor_id, created_at,
             sum(is_new_session) over (partition by visitor_id order by created_at) as session_seq
      from marked
    ),
    sessions as (
      select visitor_id, session_seq,
             count(*) as page_count,
             extract(epoch from (max(created_at) - min(created_at))) as duration_seconds
      from sessionized
      group by visitor_id, session_seq
    )
    select
      count(*) as sessions,
      count(distinct visitor_id) as visitors,
      avg(page_count) as avg_pages_per_session,
      avg(duration_seconds) as avg_duration_seconds
    from sessions
    `,
    [range.from.toISOString(), range.to.toISOString()],
  );

  const row = rows[0];
  return {
    sessions: Number(row.sessions),
    visitors: Number(row.visitors),
    avgPagesPerSession: row.avg_pages_per_session ? Number(row.avg_pages_per_session) : 0,
    avgDurationSeconds: row.avg_duration_seconds ? Number(row.avg_duration_seconds) : 0,
  };
}
