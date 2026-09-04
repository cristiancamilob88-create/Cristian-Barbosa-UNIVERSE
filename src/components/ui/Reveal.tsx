"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll-triggered fade/slide-up reveal — the first piece of the motion
 * layer Cristian asked for (2026-08-28, "quiero algo así, brutal"),
 * built to try on the homepage first before rolling out sitewide (his
 * own agreed sequencing). GSAP + ScrollTrigger, the same toolkit behind
 * most of the "premium" scroll sites he's pointing at — not a random
 * GitHub find, the actual industry standard (see docs/ARCHITECTURE.md
 * §11, motion was deliberately deferred until now).
 *
 * Respects `prefers-reduced-motion`, same as this project's existing
 * signature element (the homepage ticker, globals.css) — a visitor who
 * has that on sees content in its final state immediately, no motion
 * at all, not just a faster version of it.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger delay in seconds — for choreographing a sequence (e.g. grid cards revealing one after another). */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        },
      );
    });

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
