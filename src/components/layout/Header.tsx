import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { navItems, secondaryNavItems, siteConfig } from "@/config/site";
import { MobileNav } from "@/components/layout/MobileNav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-steel-dim/40 bg-ink/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        {/* Real logo mark (public/brand — docs/ASSETS_AND_BRAND.md
            categoría 2), added here 2026-08-28 at Cristian's request
            ("empezar a acomodarlo" en las partes vacías) — the
            square-cropped emblem (same source as favicon/icon.png),
            not the full poster art (cristian-logo-01.png), which is
            far too wide/detailed for a 64px-tall nav bar. */}
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/icon.png"
            alt=""
            aria-hidden="true"
            width={36}
            height={36}
            priority
            className="rounded-sm"
          />
          <span className="font-display text-xl font-black uppercase tracking-tight text-chalk transition-colors group-hover:text-ember">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-xs uppercase tracking-wider text-steel transition-colors hover:text-ember"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-steel transition-colors hover:text-chalk"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
