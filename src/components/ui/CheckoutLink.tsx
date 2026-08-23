/**
 * Outbound link to a `/api/checkout/<offerSlug>` redirect route (see
 * docs/COMMERCE.md, "Checkout abstraction"). Deliberately a plain `<a>`,
 * not next/link — same reasoning as GoLink (components/ui/GoLink.tsx):
 * Link prefetches routes it can see, which here would fire
 * `checkout_started` before the visitor ever clicks anything.
 *
 * Not used by any page yet — no live "buy" button exists until a real
 * product/offer detail page does (docs/COMMERCE.md). This is the
 * component that page reaches for when it exists.
 */
export function CheckoutLink({
  offerSlug,
  className,
  children,
}: {
  offerSlug: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={`/api/checkout/${offerSlug}`} className={className}>
      {children}
    </a>
  );
}
