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
    // `tag` is kept in the props (every page passes one, and it names the
    // page in code) but no longer rendered: a small mono label above the
    // title is the "eyebrow" the taste-skill redesign removed sitewide
    // (2026-10-16), same as the hairline under the hero.
    <section data-page-tag={tag} className="pb-14 pt-16 sm:pt-20">
      <Container>
        <h1
          className={`max-w-2xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-chalk sm:text-6xl ${glowClassName ?? ""}`}
        >
          {title}
        </h1>
        <p className={`mt-6 max-w-xl text-lg text-chalk ${glowClassName ?? ""}`}>{description}</p>
        {children}
      </Container>
    </section>
  );
}
