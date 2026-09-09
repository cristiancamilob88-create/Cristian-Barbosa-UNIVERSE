import "server-only";
import crypto from "node:crypto";
import { getServerEnv } from "@/server/env";
import type { OfferRow } from "@/server/db/repositories/offer";

const API_BASE = "https://api.mercadopago.com";

/**
 * Mercado Pago (Block 06, 2026-09-09 — Cristian's own choice, and he
 * already has a real account) — plain REST calls against Mercado
 * Pago's own API, no SDK dependency, same convention as
 * src/server/notifications/whatsapp.ts's direct Meta Graph API calls.
 * Scope, per Cristian's own decision that day: one-time purchases only
 * (físicos/infoproductos) — the $29.900/mes subscription stays on
 * Facebook, unchanged. Recurring Mercado Pago subscriptions
 * (`preapproval`) are a distinct API this file doesn't implement.
 *
 * Every export fails safe (returns `null`/`false`, never throws) on a
 * missing token or a bad response — the same "never break the redirect
 * the visitor is waiting on" posture as the rest of src/server/commerce/
 * and src/server/notifications/. Request/response shapes here are
 * confirmed against Mercado Pago's own public API reference
 * (https://www.mercadopago.com.co/developers/en/reference), not
 * guessed — but unlike the WhatsApp integration above, no real call has
 * been made against Cristian's actual account from this session (no
 * live credentials here to test with). Treat the FIRST real purchase
 * and the FIRST real webhook delivery as the real verification, the
 * same way the WhatsApp integration's own doc comment flags its
 * "requires an approved template" real-world gap.
 */

export interface MercadoPagoPreference {
  initPoint: string;
}

/**
 * Creates a Checkout Pro preference for one offer and returns the URL to
 * redirect the buyer to. One preference per checkout attempt (not
 * reused across buyers) — `externalReference` is how the webhook later
 * finds its way back to the right visitor/offer (see
 * buildCheckoutReference()/parseCheckoutReference() below).
 *
 * Requires `offer.priceCents` to be set — never invents a price. Only
 * for `purchase_type = 'one_time'`; a 'recurring' offer must not call
 * this (see this file's own doc comment).
 */
export async function createOneTimePreference(input: {
  offer: OfferRow;
  externalReference: string;
  siteUrl: string;
}): Promise<MercadoPagoPreference | null> {
  const { MERCADOPAGO_ACCESS_TOKEN } = getServerEnv();
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.warn("[mercadopago] MERCADOPAGO_ACCESS_TOKEN not configured — skipping preference creation.");
    return null;
  }
  if (!input.offer.priceCents || input.offer.priceCents <= 0) {
    console.warn(`[mercadopago] Offer "${input.offer.slug}" has no real price_cents — refusing to create a preference.`);
    return null;
  }

  const backUrl = new URL(input.offer.landingPath ?? "/productos", input.siteUrl).toString();
  // `auto_return` requires an absolute, publicly-reachable `success` URL
  // — Mercado Pago rejects it otherwise. A misconfigured
  // NEXT_PUBLIC_SITE_URL (see src/lib/env.ts's own doc comment on this
  // exact class of bug) would make every preference fail; omitting
  // auto_return on a non-https back URL keeps that a degraded
  // experience (buyer stays on Mercado Pago's own confirmation page)
  // instead of a broken checkout.
  const isPubliclyReachable = backUrl.startsWith("https://");

  try {
    const response = await fetch(`${API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: input.offer.name,
            quantity: 1,
            unit_price: input.offer.priceCents / 100,
            currency_id: input.offer.currency,
          },
        ],
        external_reference: input.externalReference,
        notification_url: new URL("/api/webhooks/mercadopago", input.siteUrl).toString(),
        back_urls: { success: backUrl, failure: backUrl, pending: backUrl },
        ...(isPubliclyReachable ? { auto_return: "approved" } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[mercadopago] checkout/preferences responded ${response.status}: ${body}`);
      return null;
    }

    const data = (await response.json()) as { init_point?: string };
    if (!data.init_point) {
      console.error("[mercadopago] checkout/preferences response had no init_point", data);
      return null;
    }
    return { initPoint: data.init_point };
  } catch (err) {
    console.error("[mercadopago] Failed to create preference", err);
    return null;
  }
}

export interface MercadoPagoPayment {
  id: string;
  status: string;
  transactionAmountCents: number;
  currency: string;
  externalReference: string | null;
  payerEmail: string | null;
  payerFirstName: string | null;
  payerLastName: string | null;
  payerPhone: string | null;
}

/**
 * Fetches a payment by id directly from Mercado Pago's API — the
 * webhook notification body only ever carries an id, never trust its
 * own claimed status/amount (Mercado Pago's own documented best
 * practice): always re-fetch before writing a real `orders` row.
 */
export async function getPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  const { MERCADOPAGO_ACCESS_TOKEN } = getServerEnv();
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.warn("[mercadopago] MERCADOPAGO_ACCESS_TOKEN not configured — cannot verify payment.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`[mercadopago] v1/payments/${paymentId} responded ${response.status}: ${body}`);
      return null;
    }

    const data = (await response.json()) as {
      id: number | string;
      status: string;
      transaction_amount: number;
      currency_id: string;
      external_reference: string | null;
      payer?: { email?: string | null; first_name?: string | null; last_name?: string | null; phone?: { number?: string | null } };
    };

    return {
      id: String(data.id),
      status: data.status,
      transactionAmountCents: Math.round(data.transaction_amount * 100),
      currency: data.currency_id,
      externalReference: data.external_reference ?? null,
      payerEmail: data.payer?.email ?? null,
      payerFirstName: data.payer?.first_name ?? null,
      payerLastName: data.payer?.last_name ?? null,
      payerPhone: data.payer?.phone?.number ?? null,
    };
  } catch (err) {
    console.error(`[mercadopago] Failed to fetch payment ${paymentId}`, err);
    return null;
  }
}

/**
 * Verifies Mercado Pago's webhook signature (their documented v2
 * scheme: https://www.mercadopago.com.co/developers/en/docs/your-integrations/notifications/webhooks
 * "Signature verification"). The manifest is exactly
 * `id:<dataId>;request-id:<xRequestId>;ts:<ts>;` (lowercased dataId,
 * trailing semicolon included), HMAC-SHA256'd with the dashboard's
 * "Clave secreta", hex-encoded, compared against the `v1` part of the
 * `x-signature` header. Fails closed: any missing piece (no secret
 * configured, no signature header, malformed header) is `false`, never
 * "assume valid". Real end-to-end verification against Cristian's own
 * account is still pending — see this file's own top doc comment.
 */
export function verifyWebhookSignature(input: { xSignature: string | null; xRequestId: string | null; dataId: string }): boolean {
  const { MERCADOPAGO_WEBHOOK_SECRET } = getServerEnv();
  if (!MERCADOPAGO_WEBHOOK_SECRET) {
    console.warn("[mercadopago] MERCADOPAGO_WEBHOOK_SECRET not configured — rejecting webhook.");
    return false;
  }
  if (!input.xSignature || !input.xRequestId) {
    return false;
  }

  const parts = Object.fromEntries(
    input.xSignature.split(",").map((pair) => {
      const [key, value] = pair.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", MERCADOPAGO_WEBHOOK_SECRET).update(manifest).digest("hex");

  // Constant-time comparison — this is a security boundary, not a data
  // lookup; a length mismatch must not throw (crypto.timingSafeEqual's
  // own requirement), so it's checked explicitly first.
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(v1, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/** `external_reference` encodes exactly what the webhook needs to reconstruct the checkout, nothing more. */
export function buildCheckoutReference(offerId: string, visitorId: string): string {
  return `${offerId}:${visitorId}`;
}

export function parseCheckoutReference(reference: string | null): { offerId: string; visitorId: string } | null {
  if (!reference) return null;
  const [offerId, visitorId] = reference.split(":");
  if (!offerId || !visitorId) return null;
  return { offerId, visitorId };
}
