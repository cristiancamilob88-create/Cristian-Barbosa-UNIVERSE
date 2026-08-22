import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { navItems, secondaryNavItems, siteConfig } from "@/config/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-steel-dim/40 bg-ink/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-black uppercase tracking-tight text-chalk hover:text-ember"
        >
          {siteConfig.name}
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

        <div className="hidden items-center gap-4 sm:flex">
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
      </Container>
    </header>
  );
}
