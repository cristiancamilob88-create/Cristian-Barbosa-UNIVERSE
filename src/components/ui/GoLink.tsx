/**
 * Outbound link to a `/go/<slug>` redirect route (see
 * docs/SOCIAL_ROUTING.md). Deliberately a plain `<a>`, not next/link:
 * Link prefetches GET requests to routes it can see, which for `/go/*`
 * would fire the tracked redirect (and inflate click counts) before the
 * visitor ever clicks anything.
 */
export function GoLink({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={`/go/${slug}`} className={className}>
      {children}
    </a>
  );
}
