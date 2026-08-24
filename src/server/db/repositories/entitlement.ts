import "server-only";
import type { Pool, PoolClient } from "pg";

export interface EntitlementRow {
  id: string;
  contactId: string;
  productId: string;
  orderId: string | null;
  grantedAt: string;
}

interface RawEntitlementRow {
  id: string;
  contact_id: string;
  product_id: string;
  order_id: string | null;
  granted_at: string;
}

function toEntitlement(row: RawEntitlementRow): EntitlementRow {
  return {
    id: row.id,
    contactId: row.contact_id,
    productId: row.product_id,
    orderId: row.order_id,
    grantedAt: row.granted_at,
  };
}

/**
 * Grants a contact access to a product — the one write this table ever
 * needs (docs/MASTER_BRIEF_BLOCK_08.md, "08.2"). Idempotent: granting
 * twice for the same contact+product is a no-op, not a duplicate row
 * or an error — a manual reconciliation step (Decision Gate 3, no
 * automated payment confirmation exists yet) re-running against the
 * same purchase must never fail.
 */
export async function grantEntitlement(
  client: PoolClient,
  input: { contactId: string; productId: string; orderId?: string | null },
): Promise<EntitlementRow> {
  const result = await client.query<RawEntitlementRow>(
    `insert into entitlement (contact_id, product_id, order_id)
     values ($1, $2, $3)
     on conflict (contact_id, product_id) do update set order_id = coalesce(entitlement.order_id, excluded.order_id)
     returning id, contact_id, product_id, order_id, granted_at`,
    [input.contactId, input.productId, input.orderId ?? null],
  );
  return toEntitlement(result.rows[0]);
}

/** Whether a contact already has confirmed access to a product — the read this table exists to answer. */
export async function hasEntitlement(db: Pool | PoolClient, contactId: string, productId: string): Promise<boolean> {
  const result = await db.query(
    "select 1 from entitlement where contact_id = $1 and product_id = $2 limit 1",
    [contactId, productId],
  );
  return (result.rowCount ?? 0) > 0;
}
