-- 0005_commerce_infrastructure.sql — Block 05: Commerce/Offers/Conversion
-- infrastructure.
--
-- Purely additive: no table dropped or renamed, no existing row's
-- meaning changes, no application code currently reads `product.kind`
-- or `offer`'s existing columns in a way this could break (verified —
-- neither is referenced anywhere under src/ yet, this schema has been
-- catalog-only since 0001). Reversible column-by-column
-- (`alter table ... drop column ...`) if ever needed.
--
-- Goal, per the brief: go from "we know someone viewed something" to
-- "we know which offer they viewed, what they did, what they bought,
-- and where they came from" — without inventing a payment integration.
-- See docs/COMMERCE.md for the full model review this migration
-- executes and the checkout abstraction it exists to support.

-- ---------------------------------------------------------------------
-- product: richer catalog fields (still asset-level, not commercial —
-- price/campaign/landing stay on `offer`, unchanged).
-- ---------------------------------------------------------------------

alter table product
  add column description text,
  add column image_url text,
  -- Reference/base price — NOT the selling price (that's offer.price_cents,
  -- already nullable for the same "no inventar precios" reason). Nullable:
  -- a product can exist in the catalog before pricing is decided.
  add column base_price_cents integer;

-- Extend the category taxonomy the brief names (digital/physical/music/
-- community/coaching/service/show/partnership) without dropping the
-- values Block 02 already seeded data with ('subscription' — the
-- Facebook Subscription community product, 'coaching', 'show'). Both
-- 'subscription' and the new 'community' exist on purpose: Block 02
-- named that product by mechanism (how it's delivered), the brief
-- names this dimension by offering type — new products should prefer
-- 'community', 'subscription' stays valid so this migration never
-- needs to rewrite existing rows. See docs/COMMERCE.md, "Product kind
-- taxonomy" for the full rationale.
alter table product drop constraint product_kind_check;
alter table product add constraint product_kind_check check (kind in (
  'physical', 'digital', 'subscription', 'coaching', 'show',
  'music', 'community', 'service', 'partnership'
));

comment on column product.base_price_cents is
  'Reference/base price shown at the product level — NOT the selling '
  'price. An offer''s own price_cents is the commercial figure (a '
  'product can have several offers at different prices/campaigns).';

-- ---------------------------------------------------------------------
-- offer: the checkout abstraction. An offer now knows HOW it's bought
-- (purchase_type) and WHERE that checkout happens (checkout_provider +
-- checkout_url) without this app ever processing a real payment —
-- src/server/commerce/checkout.ts reads exactly these columns to decide
-- where a "buy" click goes. Swapping in a real provider later (Hotmart,
-- Stripe, Mercado Pago) means setting these columns on existing offer
-- rows, never restructuring the schema or the checkout route.
-- ---------------------------------------------------------------------

alter table offer
  add column checkout_provider text not null default 'unavailable'
    check (checkout_provider in ('internal', 'hotmart', 'stripe', 'mercadopago', 'manual', 'unavailable')),
  add column checkout_url text,
  add column purchase_type text not null default 'one_time'
    check (purchase_type in ('one_time', 'recurring', 'quote')),
  -- The exact CTA button text this offer should render, e.g. "Quiero
  -- entrenar personalmente con Cristian" — ties an offer to Block
  -- 04.2's intent-phrase convention (docs/UNIVERSE_UX.md) without
  -- hardcoding that copy in a page component. Nullable: falls back to
  -- a generic label until someone sets one.
  add column cta_label text,
  add column metadata jsonb not null default '{}'::jsonb;

comment on column offer.checkout_provider is
  '''unavailable'' (default) means no real checkout exists yet for this '
  'offer — src/server/commerce/checkout.ts routes it to a lead-capture '
  '(quote) fallback instead of a broken buy button. ''internal'' is '
  'reserved for a future first-party checkout this app builds itself; '
  'the rest are external providers whose checkout_url this offer redirects to.';
comment on column offer.purchase_type is
  '''one_time'' (default) vs ''recurring'' (subscription-style, e.g. '
  'Facebook Subscription) vs ''quote'' (no fixed price — shows/brands/'
  'high-ticket coaching, resolved to a lead-capture flow instead of a '
  'checkout redirect regardless of checkout_provider).';

-- No new indexes: `offer` is dictionary-sized (a handful to a few dozen
-- rows), not row-count-of-`interaction`-sized — see docs/ANALYTICS_ENGINE.md,
-- "Indexes", for the same reasoning applied to this table.
