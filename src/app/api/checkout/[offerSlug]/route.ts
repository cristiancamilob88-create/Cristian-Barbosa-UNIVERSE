import { NextResponse, type NextRequest } from "next/server";
import { visitorCookieOptions, VISITOR_COOKIE } from "@/lib/attribution";
import { withTransaction } from "@/server/db/transaction";
import { getPool } from "@/server/db/pool";
import { resolveVisitorContext } from "@/server/db/visitorContext";
import { getActiveOfferBySlug } from "@/server/db/repositories/offer";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { resolveCheckoutDestination } from "@/server/commerce/checkout";
import { createRateLimiter, getRequestIp } from "@/server/rateLimit";

// Higher ceiling than /api/lead's — this is a GET/redirect a visitor can
// legitimately hit several times in one browsing session (multiple
// offers, a shared office/carrier IP), not a form submission. Still
// bounded: every request does a DB read (offer lookup) plus a write
// (checkout_started), so an unbounded burst is real DB load, not just
// noise.
const checkoutRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

/**
 * The one entry point into "offer → checkout → order → attribution →
 * analytics" (Block 05 brief) — records `checkout_started` server-side
 * (same reasoning as `/go/[slug]`: works with JS disabled, isn't
 * strippable by a client-side blocker) attributed to this specific
 * offer via `entity_type`/`entity_id`, then redirects to wherever
 * `resolveCheckoutDestination()` (src/server/commerce/checkout.ts)
 * decides — a real external checkout URL if the offer has a live
 * provider, otherwise a lead-capture fallback. No page links here yet
 * (no live checkout to link to) — see docs/COMMERCE.md, "What's not
 * wired yet".
 *
 * `CheckoutLink` (src/components/ui/CheckoutLink.tsx) is the plain
 * `<a>` a future "buy" button points at — deliberately not next/link,
 * same prefetch-inflation reasoning as GoLink.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ offerSlug: string }> }) {
  if (checkoutRateLimiter.isRateLimited(getRequestIp(request))) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 },
    );
  }

  const { offerSlug } = await params;

  const offer = await getActiveOfferBySlug(getPool(), offerSlug);
  if (!offer) {
    return NextResponse.redirect(new URL("/productos", request.url));
  }

  const destination = resolveCheckoutDestination(offer);
  const redirectUrl = destination.kind === "external" ? destination.url : new URL(destination.url, request.url);

  try {
    const { visitorId, isNewVisitorId } = await withTransaction(async (client) => {
      const visitorCtx = await resolveVisitorContext(client, request);
      await recordInteraction(client, {
        visitorId: visitorCtx.visitorId,
        contactId: visitorCtx.contactId,
        eventName: "checkout_started",
        route: request.nextUrl.pathname,
        touch: visitorCtx.touch,
        metadata: { offerSlug: offer.slug, productId: offer.productId, checkoutKind: destination.kind },
        entity: { type: "offer", id: offer.id },
      });
      return { visitorId: visitorCtx.visitorId, isNewVisitorId: visitorCtx.isNewVisitorId };
    });

    const response = NextResponse.redirect(redirectUrl, { status: 307 });
    if (isNewVisitorId) {
      response.cookies.set(VISITOR_COOKIE, visitorId, visitorCookieOptions);
    }
    return response;
  } catch (err) {
    // Tracking must never block the redirect a visitor is waiting on.
    console.error("[checkout] failed to record checkout_started", err);
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }
}
