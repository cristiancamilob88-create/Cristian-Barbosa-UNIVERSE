import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { contactNavItem, primaryNavItems, siteConfig } from "@/config/site";
import { MobileNav } from "@/components/layout/MobileNav";
import { MoreMenu } from "@/components/layout/MoreMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-ink">
      <Container className="flex h-16 items-center justify-between">
        {/* Real logo mark (public/brand — docs/ASSETS_AND_BRAND.md
            categoría 2), added here 2026-08-28 at Cristian's request
            ("empezar a acomodarlo" en las partes vacías) — the
            square-cropped emblem (same source as favicon/icon.png),
            not the full poster art (cristian-logo-01.png), which is
            far too wide/detailed for a 64px-tall nav bar. */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
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

        {/* 2026-10-07 reorganization: the 4 paths + the map, a "Más"
            menu for the rest, and Contacto as the one button. */}
        <nav aria-label="Principal" className="ml-6 hidden items-center gap-6 lg:flex">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[15px] font-semibold text-chalk transition-colors hover:text-ember"
            >
              {item.label}
            </Link>
          ))}
          <MoreMenu />
        </nav>

        <div className="ml-6 hidden shrink-0 items-center lg:flex">
          <Link
            href={contactNavItem.href}
            className="whitespace-nowrap bg-ember px-4 py-2 text-[15px] font-bold text-ink transition-colors hover:bg-chalk"
          >
            {contactNavItem.label}
          </Link>
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
