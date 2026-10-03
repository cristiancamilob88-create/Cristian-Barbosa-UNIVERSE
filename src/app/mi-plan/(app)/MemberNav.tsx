"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/mi-plan", label: "Mi semana" },
  { href: "/mi-plan/plan", label: "Mi plan" },
  { href: "/mi-plan/biblioteca", label: "Biblioteca" },
] as const;

export function MemberNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mi plan" className="flex gap-1 overflow-x-auto border-b border-steel-dim/40">
      {ITEMS.map((item) => {
        const active = item.href === "/mi-plan" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
              active ? "border-ember text-chalk" : "border-transparent text-steel hover:text-chalk"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
