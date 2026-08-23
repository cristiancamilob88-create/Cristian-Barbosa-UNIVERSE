import "server-only";
import type { Pool, PoolClient } from "pg";

export type CheckoutProvider = "internal" | "hotmart" | "stripe" | "mercadopago" | "manual" | "unavailable";
export type PurchaseType = "one_time" | "recurring" | "quote";

export interface OfferRow {
  id: string;
  productId: string;
  campaignId: string | null;
  slug: string;
  name: string;
  priceCents: number | null;
  currency: string;
  landingPath: string | null;
  active: boolean;
  checkoutProvider: CheckoutProvider;
  checkoutUrl: string | null;
  purchaseType: PurchaseType;
  ctaLabel: string | null;
  metadata: Record<string, unknown>;
}

interface RawOfferRow {
  id: string;
  product_id: string;
  campaign_id: string | null;
  slug: string;
  name: string;
  price_cents: number | null;
  currency: string;
  landing_path: string | null;
  active: boolean;
  checkout_provider: CheckoutProvider;
  checkout_url: string | null;
  purchase_type: PurchaseType;
  cta_label: string | null;
  metadata: Record<string, unknown>;
}

function toOffer(row: RawOfferRow): OfferRow {
  return {
    id: row.id,
    productId: row.product_id,
    campaignId: row.campaign_id,
    slug: row.slug,
    name: row.name,
    priceCents: row.price_cents,
    currency: row.currency,
    landingPath: row.landing_path,
    active: row.active,
    checkoutProvider: row.checkout_provider,
    checkoutUrl: row.checkout_url,
    purchaseType: row.purchase_type,
    ctaLabel: row.cta_label,
    metadata: row.metadata,
  };
}

const SELECT_COLUMNS = `
  id, product_id, campaign_id, slug, name, price_cents, currency, landing_path,
  active, checkout_provider, checkout_url, purchase_type, cta_label, metadata
`;

/**
 * The one lookup `/api/checkout/[offerSlug]` needs (src/server/commerce/checkout.ts) —
 * an inactive or unknown offer resolves to `null`, never a checkout for
 * something that isn't actually for sale.
 */
export async function getActiveOfferBySlug(db: Pool | PoolClient, slug: string): Promise<OfferRow | null> {
  const result = await db.query<RawOfferRow>(
    `select ${SELECT_COLUMNS} from offer where slug = $1 and active = true`,
    [slug],
  );
  return result.rows[0] ? toOffer(result.rows[0]) : null;
}

/** Every active offer for one product — e.g. a future product detail page listing its offers. */
export async function listActiveOffersByProduct(db: Pool | PoolClient, productId: string): Promise<OfferRow[]> {
  const result = await db.query<RawOfferRow>(
    `select ${SELECT_COLUMNS} from offer where product_id = $1 and active = true order by created_at asc`,
    [productId],
  );
  return result.rows.map(toOffer);
}
