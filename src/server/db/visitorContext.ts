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
 * The one function every DB-backed route (`/api/lead`, `/api/track`,
 * `/go/[slug]`) calls first: resolves who's making this request (visitor
 * id, and contact id if already identified) and what attribution
 * currently applies, upserting the `visitor` row along the way.
 *
 * Does not touch cookies on the response — callers set `cb_visitor`
 * themselves when `isNewVisitorId` is true, since only the caller knows
 * whether it's building a redirect or a JSON response.
 */
export async function resolveVisitorContext(
  client: PoolClient,
  request: NextRequest,
): Promise<VisitorContext> {
  const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();

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
