import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

/**
 * Shared hero shell for pillar route pages, so each one stays visually
 * part of the same system. `glowClassName` is optional and additive —
 * every existing call site (every page but /shows, today) renders
 * exactly as before; only a page with a busy image behind this hero
 * needs to opt in.
 */
export function PageHero({
  tag,
  title,
  description,
  children,
  glowClassName,
}: {
  tag: string;
  title: string;
  description: string;
  children?: ReactNode;
  /** Extra classes appended to the tag/title/description — built for
   * the neon-glow treatment on /shows (Cristian's own request,
   * 2026-08-28: "tipo efecto neón" once the hero sits over a photo). */
  glowClassName?: string;
}) {
  return (
    <section className="border-b border-steel-dim/40 pb-14 pt-16 sm:pt-20">
      <Container>
        <p className={`font-mono text-xs uppercase tracking-[0.2em] text-ember ${glowClassName ?? ""}`}>{tag}</p>
        <h1
          className={`mt-4 max-w-2xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-chalk sm:text-6xl ${glowClassName ?? ""}`}
        >
          {title}
        </h1>
        <p className={`mt-6 max-w-xl text-lg text-steel ${glowClassName ?? ""}`}>{description}</p>
        {children}
      </Container>
    </section>
  );
}
