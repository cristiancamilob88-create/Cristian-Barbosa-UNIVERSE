import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

/** Shared hero shell for pillar route pages, so each one stays visually part of the same system. */
export function PageHero({
  tag,
  title,
  description,
  children,
}: {
  tag: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-steel-dim/40 pb-14 pt-16 sm:pt-20">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">{tag}</p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-chalk sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-steel">{description}</p>
        {children}
      </Container>
    </section>
  );
}
