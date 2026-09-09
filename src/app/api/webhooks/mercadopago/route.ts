import { NextResponse, type NextRequest } from "next/server";
import { withTransaction } from "@/server/db/transaction";
import { getOfferById } from "@/server/db/repositories/offer";
import { getVisitor, linkVisitorToContact } from "@/server/db/repositories/visitor";
import { findOrCreateContact } from "@/server/db/repositories/contact";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { findOrderByExternalId, createPaidOrder } from "@/server/db/repositories/order";
import { getPayment, verifyWebhookSignature, parseCheckoutReference } from "@/server/commerce/mercadopago";
import type { ResolvedTouch } from "@/server/db/repositories/reference";

/**
 * Mercado Pago's payment-event webhook (Block 06, docs/COMMERCE.md) —
 * the first real writer of `orders`/`order_items` for a purchase that
 * happened through this app's own checkout. Public and unauthenticated
 * by nature (Mercado Pago's own servers call this), so signature
 * verification IS the access control here — not a session, not a
 * bearer token, and deliberately NOT rate-limited (see
 * docs/SECURITY.md's rate-limiting table: this endpoint's real gate is
 * `verifyWebhookSignature()`; a per-IP limit would risk dropping
 * Mercado Pago's own legitimate retries during a real traffic burst).
 *
 * Never trusts the webhook body's own claimed amount/status — always
 * re-fetches the payment from Mercado Pago's API first (their own
 * documented best practice, and this file's `getPayment()`'s own doc
 * comment).
 */
export async function POST(request: NextRequest) {
  let body: { type?: string; data?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Mercado Pago sends `data.id` both as a query param on the
  // notification URL and in the JSON body — the signature is computed
  // over the query-param value; falling back to the body's is a safety
  // net for a delivery shape that omits the query param, not the
  // primary path.
  const dataId = request.nextUrl.searchParams.get("data.id") ?? body.data?.id ?? null;
  const type = request.nextUrl.searchParams.get("type") ?? body.type ?? null;

  if (!dataId) {
    // Nothing to verify or act on — ack so Mercado Pago doesn't retry
    // forever over a shape this route doesn't recognize.
    return NextResponse.json({ ok: true, skipped: "no data.id" });
  }

  const verified = verifyWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!verified) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  if (type !== "payment") {
    // Mercado Pago also fires webhooks for other resource types
    // (merchant_order, etc.) — ack, nothing for this route to do.
    return NextResponse.json({ ok: true, skipped: `unhandled type "${type}"` });
  }

  const payment = await getPayment(dataId);
  if (!payment) {
    // Couldn't verify the payment against Mercado Pago's own API —
    // never write an order from an unconfirmed claim. 200, not 500:
    // this isn't a transient failure worth a retry storm, it's "this
    // payment id doesn't check out."
    return NextResponse.json({ ok: true, skipped: "payment not found or API unreachable" });
  }

  if (payment.status !== "approved") {
    // pending/rejected/etc. — real states, just not a paid order yet.
    return NextResponse.json({ ok: true, skipped: `payment status "${payment.status}"` });
  }

  const reference = parseCheckoutReference(payment.externalReference);
  if (!reference) {
    console.error(`[mercadopago webhook] Approved payment ${payment.id} has no parseable external_reference`);
    return NextResponse.json({ ok: true, skipped: "unparseable external_reference" });
  }

  try {
    await withTransaction(async (client) => {
      // Idempotent: Mercado Pago retries webhook delivery — never
      // double-write the same payment as two orders.
      const existingOrder = await findOrderByExternalId(client, "mercadopago", payment.id);
      if (existingOrder) return;

      const offer = await getOfferById(client, reference.offerId);
      if (!offer) {
        console.error(`[mercadopago webhook] Payment ${payment.id} references unknown offer ${reference.offerId}`);
        return;
      }

      const visitor = await getVisitor(client, reference.visitorId);
      if (!visitor) {
        console.error(`[mercadopago webhook] Payment ${payment.id} references unknown visitor ${reference.visitorId}`);
        return;
      }

      const touch: ResolvedTouch = {
        sourceId: visitor.last_touch_source_id,
        campaignId: visitor.last_touch_campaign_id,
        qrId: visitor.last_touch_qr_id,
        medium: visitor.last_touch_medium,
        content: visitor.last_touch_content,
        term: visitor.last_touch_term,
        referrer: visitor.last_touch_referrer,
        landingPath: visitor.last_touch_landing_path,
        capturedAt: visitor.last_touch_captured_at,
      };

      const fullName = [payment.payerFirstName, payment.payerLastName].filter(Boolean).join(" ") || null;
      const { contact } = await findOrCreateContact(
        client,
        { email: payment.payerEmail, phone: payment.payerPhone, name: fullName },
        visitor,
      );
      await linkVisitorToContact(client, visitor.id, contact.id);

      await createPaidOrder(client, {
        contactId: contact.id,
        offerId: offer.id,
        externalProvider: "mercadopago",
        externalOrderId: payment.id,
        currency: payment.currency,
        totalCents: payment.transactionAmountCents,
        paidAt: new Date().toISOString(),
      });

      await recordInteraction(client, {
        visitorId: visitor.id,
        contactId: contact.id,
        eventName: "purchase",
        route: null,
        touch,
        metadata: { offerSlug: offer.slug, provider: "mercadopago", paymentId: payment.id },
        entity: { type: "offer", id: offer.id },
      });
    });
  } catch (err) {
    console.error("[mercadopago webhook] Failed to record paid order", err);
    // A real 500 here is correct (unlike the skip cases above) — this
    // IS a transient failure (e.g. a DB hiccup) worth Mercado Pago's
    // own retry.
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
