import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { visitorCookieOptions, VISITOR_COOKIE } from "@/lib/attribution";
import { withTransaction } from "@/server/db/transaction";
import { getPool } from "@/server/db/pool";
import { resolveVisitorContext, peekVisitorId } from "@/server/db/visitorContext";
import { getActiveOfferBySlug } from "@/server/db/repositories/offer";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { resolveCheckoutDestination } from "@/server/commerce/checkout";
import { createOneTimePreference, buildCheckoutReference } from "@/server/commerce/mercadopago";
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
 * provider, otherwise a lead-capture fallback. See docs/COMMERCE.md,
 * "What's not wired yet" for how that's changed since Block 05: an
 * offer with `checkout_provider = 'mercadopago'` gets a REAL, dynamic
 * Mercado Pago Checkout Pro preference here (Block 06) — the one
 * provider `resolveCheckoutDestination()` itself can't handle, since
 * Mercado Pago has no static per-offer `checkout_url` to store (a
 * preference is created fresh per checkout attempt, via a network
 * call). That call happens BEFORE the DB transaction below (using
 * `peekVisitorId()`, no DB round-trip) so a slow/failed external API
 * call never holds a pooled connection open.
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

  // Always have a safe, synchronous fallback locked in before anything
  // async/network happens below — so a Mercado Pago API failure (or a
  // later DB error) never leaves this route without somewhere safe to
  // send the visitor.
  const destination = resolveCheckoutDestination(offer);
  let redirectUrl = destination.kind === "external" ? destination.url : new URL(destination.url, request.url);
  let checkoutKind: string = destination.kind;

  // Computed once, reused everywhere below — see resolveVisitorContext()'s
  // own doc comment on precomputedVisitorId for why this can't just be
  // called again inside the transaction.
  const precomputedVisitorId = peekVisitorId(request);

  if (offer.active && offer.purchaseType === "one_time" && offer.checkoutProvider === "mercadopago") {
    const preference = await createOneTimePreference({
      offer,
      externalReference: buildCheckoutReference(offer.id, precomputedVisitorId),
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
    });
    if (preference) {
      redirectUrl = preference.initPoint;
      checkoutKind = "external";
    }
  }

  try {
    const { visitorId, isNewVisitorId } = await withTransaction(async (client) => {
      const visitorCtx = await resolveVisitorContext(client, request, precomputedVisitorId);
      await recordInteraction(client, {
        visitorId: visitorCtx.visitorId,
        contactId: visitorCtx.contactId,
        eventName: "checkout_started",
        route: request.nextUrl.pathname,
        touch: visitorCtx.touch,
        metadata: { offerSlug: offer.slug, productId: offer.productId, checkoutKind },
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
