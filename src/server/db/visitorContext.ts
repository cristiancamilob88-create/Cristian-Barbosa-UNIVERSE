import "server-only";
import type { NextRequest } from "next/server";
import type { PoolClient } from "pg";
import { LAST_TOUCH_COOKIE, VISITOR_COOKIE, deserializeSource } from "@/lib/attribution";
import { resolveTouch, type ResolvedTouch } from "./repositories/reference";
import { recordVisitorTouch, getVisitor, findContactIdForVisitor, type VisitorRow } from "./repositories/visitor";

export interface VisitorContext {
  visitorId: string;
  /** True when the request had no cb_visitor cookie yet — the caller must set one on its response. */
  isNewVisitorId: boolean;
  visitor: VisitorRow;
  /** The visitor's current last-touch, already resolved to DB ids — pass straight into recordInteraction/createLead. */
  touch: ResolvedTouch;
  contactId: string | null;
}

/**
 * The visitor id a request already carries (its `cb_visitor` cookie), or
 * a freshly-generated one if it doesn't — no DB round-trip either way,
 * unlike `resolveVisitorContext` below. Exists for a caller that needs
 * to know the id BEFORE opening a DB transaction — e.g. a checkout
 * route building a Mercado Pago preference (a network call) ahead of
 * time, so that call doesn't hold a pooled connection open for its
 * duration. `resolveVisitorContext` reads the same cookie the same way,
 * so calling this first and then that still resolves to one consistent id.
 */
export function peekVisitorId(request: NextRequest): string {
  return request.cookies.get(VISITOR_COOKIE)?.value || crypto.randomUUID();
}

/**
 * The one function every DB-backed route (`/api/lead`, `/api/track`,
 * `/go/[slug]`) calls first: resolves who's making this request (visitor
 * id, and contact id if already identified) and what attribution
 * currently applies, upserting the `visitor` row along the way.
 *
 * Does not touch cookies on the response — callers set `cb_visitor`
 * themselves when `isNewVisitorId` is true, since only the caller knows
 * whether it's building a redirect or a JSON response.
 *
 * `precomputedVisitorId` is for a caller that already called
 * `peekVisitorId()` itself before this (e.g. to use the id in a network
 * call made ahead of opening this transaction) — passing it back here
 * guarantees the SAME id is used, rather than this function generating
 * its own fresh random one for a not-yet-cookied visitor (two
 * independent `crypto.randomUUID()` calls would silently diverge).
 */
export async function resolveVisitorContext(
  client: PoolClient,
  request: NextRequest,
  precomputedVisitorId?: string,
): Promise<VisitorContext> {
  const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId ?? precomputedVisitorId ?? peekVisitorId(request);

  const lastTouchSource = deserializeSource(request.cookies.get(LAST_TOUCH_COOKIE)?.value);
  const touch = await resolveTouch(client, lastTouchSource);

  await recordVisitorTouch(client, visitorId, touch);
  const visitor = await getVisitor(client, visitorId);
  if (!visitor) {
    throw new Error(`visitor row missing immediately after upsert (id: ${visitorId})`);
  }

  const contactId = await findContactIdForVisitor(client, visitorId);

  return { visitorId, isNewVisitorId: !existingVisitorId, visitor, touch, contactId };
}
