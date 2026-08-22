import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { visitorCookieOptions, VISITOR_COOKIE } from "@/lib/attribution";
import { withTransaction } from "@/server/db/transaction";
import { resolveVisitorContext } from "@/server/db/visitorContext";
import { recordInteraction, INTERACTION_EVENT_NAMES } from "@/server/db/repositories/interaction";

/**
 * Persistence sink for a subset of client-fired analytics events — see
 * docs/ANALYTICS.md for exactly which `AnalyticsEvent` variants call this
 * (via lib/analytics.ts's `track()`) versus staying console-only.
 * `lead_submitted` is written directly by /api/lead instead of routed
 * through here, since that route already holds a transaction and a
 * resolved contact — going through a second HTTP round trip would be
 * pure overhead.
 *
 * No auth: this endpoint only ever writes an `interaction` row scoped to
 * the caller's own (cookie) visitor id — there's nothing here for one
 * visitor to read or corrupt about another.
 */

const trackSchema = z.object({
  eventName: z.enum(INTERACTION_EVENT_NAMES),
  route: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Evento inválido." }, { status: 400 });
  }

  try {
    const { visitorId, isNewVisitorId } = await withTransaction(async (client) => {
      const visitorCtx = await resolveVisitorContext(client, request);
      await recordInteraction(client, {
        visitorId: visitorCtx.visitorId,
        contactId: visitorCtx.contactId,
        eventName: parsed.data.eventName,
        route: parsed.data.route ?? null,
        touch: visitorCtx.touch,
        metadata: parsed.data.metadata,
      });
      return { visitorId: visitorCtx.visitorId, isNewVisitorId: visitorCtx.isNewVisitorId };
    });

    const response = NextResponse.json({ ok: true });
    if (isNewVisitorId) {
      response.cookies.set(VISITOR_COOKIE, visitorId, visitorCookieOptions);
    }
    return response;
  } catch (err) {
    console.error("[track] failed to persist", err);
    // Analytics failures should never surface as a user-facing error.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
