import type { ReactNode } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";

/**
 * Shared hero shell for pillar route pages, so each one stays visually
 * part of the same system. `glowClassName` is optional and additive —
 * every existing call site (every page but /shows, today) renders
 * exactly as before; only a page with a busy image behind this hero
 * needs to opt in.
 *
 * `image` (premium pass, 2026-10-16 — Cristian: "que se vea premium,
 * pero sencillo") turns the hero into the homepage's pattern: one full-
 * bleed photograph, the title at display size over a neutral scrim, one
 * sentence. Without it the hero is type only, still at display size so
 * the first screen has one thing that leads.
 */
export function PageHero({
  tag,
  title,
  description,
  children,
  glowClassName,
  image,
}: {
  tag: string;
  title: string;
  description: string;
  children?: ReactNode;
  /** Extra classes appended to the tag/title/description — built for
   * the neon-glow treatment on /shows (Cristian's own request,
   * 2026-08-28: "tipo efecto neón" once the hero sits over a photo). */
  glowClassName?: string;
  /** A real photo from /public/brand; `position` is its object-position. */
  image?: { src: string; alt: string; position?: string };
}) {
  const text = (
    <>
      <h1
        className={`cb-rise max-w-4xl font-display text-[13vw] font-black uppercase leading-[0.88] tracking-[-0.03em] text-chalk sm:text-7xl lg:text-8xl ${glowClassName ?? ""}`}
      >
        {title}
      </h1>
      <p className={`cb-rise cb-rise-2 mt-5 max-w-xl text-lg leading-snug text-chalk sm:text-xl ${glowClassName ?? ""}`}>{description}</p>
      {children && <div className="cb-rise cb-rise-3">{children}</div>}
    </>
  );

  // `tag` is kept in the props (every page passes one, and it names the
  // page in code) but no longer rendered: a small mono label above the
  // title is the "eyebrow" the taste-skill redesign removed sitewide
  // (2026-10-16), same as the hairline under the hero.
  if (image) {
    return (
      <section
        data-page-tag={tag}
        className="relative flex h-[72svh] min-h-[480px] flex-col justify-end overflow-hidden"
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="100vw"
          className={`cb-slow-drift object-cover ${image.position ?? "object-center"}`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,13,12,0.95)_0%,rgba(11,13,12,0.5)_45%,rgba(11,13,12,0)_75%)]" /* taste-skill-ignore: neutral scrim under text on a photo */ />
        <Container className="relative pb-10 lg:pb-14">{text}</Container>
      </section>
    );
  }

  return (
    <section data-page-tag={tag} className="pb-14 pt-16 sm:pt-20">
      <Container>{text}</Container>
    </section>
  );
}
