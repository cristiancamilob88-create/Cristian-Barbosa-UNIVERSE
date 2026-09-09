import "server-only";
import type { PoolClient } from "pg";

export interface OrderRow {
  id: string;
  contactId: string;
  status: string;
}

/**
 * The first real writer of `orders`/`order_items` (Block 06 — Mercado
 * Pago, docs/COMMERCE.md; both tables existed since Block 02 as
 * "catalog/read shape only, ready for a future checkout integration to
 * write into" — see their own table comments in
 * 0001_init_schema.sql). One order, one item: every offer here is
 * `quantity = 1` (a single subscription/course/product per checkout,
 * matching what `createOneTimePreference()` sends Mercado Pago) — a
 * real multi-item cart is a future, separate feature.
 */
export async function findOrderByExternalId(
  client: PoolClient,
  externalProvider: string,
  externalOrderId: string,
): Promise<OrderRow | null> {
  const result = await client.query<OrderRow>(
    `select id, contact_id as "contactId", status
     from orders where external_provider = $1 and external_order_id = $2`,
    [externalProvider, externalOrderId],
  );
  return result.rows[0] ?? null;
}

export async function createPaidOrder(
  client: PoolClient,
  input: {
    contactId: string;
    offerId: string;
    externalProvider: string;
    externalOrderId: string;
    currency: string;
    totalCents: number;
    paidAt: string;
  },
): Promise<OrderRow> {
  const order = await client.query<OrderRow>(
    `insert into orders (
       contact_id, external_provider, external_order_id,
       currency, subtotal_cents, total_cents, status, paid_at
     ) values ($1, $2, $3, $4, $5, $5, 'paid', $6)
     returning id, contact_id as "contactId", status`,
    [input.contactId, input.externalProvider, input.externalOrderId, input.currency, input.totalCents, input.paidAt],
  );

  await client.query(
    `insert into order_items (order_id, offer_id, quantity, unit_price_cents)
     values ($1, $2, 1, $3)`,
    [order.rows[0].id, input.offerId, input.totalCents],
  );

  return order.rows[0];
}
