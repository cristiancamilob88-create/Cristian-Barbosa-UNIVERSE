import { NextResponse, type NextRequest } from "next/server";
import { visitorCookieOptions, VISITOR_COOKIE } from "@/lib/attribution";
import { withTransaction } from "@/server/db/transaction";
import { getPool } from "@/server/db/pool";
import { resolveVisitorContext } from "@/server/db/visitorContext";
import { getActiveSocialProfileBySlug } from "@/server/db/repositories/socialProfile";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { classifyOutboundEvent } from "@/lib/socialPlatform";

/**
 * Controlled outbound routing: `/go/<slug>` records a `social_click`,
 * `whatsapp_click`, or `outbound_click` interaction server-side (see
 * classifyOutboundEvent — docs/ANALYTICS_ENGINE.md), then 307-redirects
 * to the real destination — see docs/SOCIAL_ROUTING.md.
 *
 * Server-side on purpose: this works with JavaScript disabled and isn't
 * strippable the way a client-side pixel/fetch can be by a blocker, so
 * "how many people who entered from a show clicked Instagram" stays
 * answerable regardless of the visitor's client. A plain `<a>` (not
 * next/link) must point here — see components/ui/GoLink.tsx — so Next's
 * router never prefetches this route and inflates the click count.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const profile = await getActiveSocialProfileBySlug(getPool(), slug);
  if (!profile) {
    return NextResponse.redirect(new URL("/redes", request.url));
  }

  try {
    const { visitorId, isNewVisitorId } = await withTransaction(async (client) => {
      const visitorCtx = await resolveVisitorContext(client, request);
      await recordInteraction(client, {
        visitorId: visitorCtx.visitorId,
        contactId: visitorCtx.contactId,
        eventName: classifyOutboundEvent(profile.platform),
        route: request.nextUrl.pathname,
        touch: visitorCtx.touch,
        metadata: { platform: profile.platform, slug: profile.slug },
      });
      return { visitorId: visitorCtx.visitorId, isNewVisitorId: visitorCtx.isNewVisitorId };
    });

    const response = NextResponse.redirect(profile.url, { status: 307 });
    if (isNewVisitorId) {
      response.cookies.set(VISITOR_COOKIE, visitorId, visitorCookieOptions);
    }
    return response;
  } catch (err) {
    // Tracking must never block the actual redirect a visitor is waiting on.
    console.error("[go] failed to record click", err);
    return NextResponse.redirect(profile.url, { status: 307 });
  }
}
