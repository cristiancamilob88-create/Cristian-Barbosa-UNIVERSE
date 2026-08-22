"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * A normal Link/anchor that fires one analytics event on click before
 * navigating. Use this for commercial CTAs (a coaching tier, "solicitar
 * información") — for outbound social/community links, use GoLink
 * (components/ui/GoLink.tsx) instead, which tracks server-side via
 * `/go/<slug>` and works without client JS. See docs/SOCIAL_ROUTING.md.
 */
export function TrackedLink({
  event,
  href,
  external = false,
  className,
  children,
  ...rest
}: {
  event: AnalyticsEvent;
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentProps<"a">, "href" | "onClick">) {
  const handleClick = () => track(event);

  if (external) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
