"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "./actions";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/fuentes", label: "Fuentes" },
  { href: "/admin/social", label: "Social" },
  { href: "/admin/qr", label: "QR" },
  { href: "/admin/landings", label: "Páginas" },
  { href: "/admin/funnel", label: "Embudo" },
  { href: "/admin/leads", label: "Registros" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/revenue", label: "Ingresos" },
  { href: "/admin/canales", label: "Canales" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-steel-dim/40 bg-ink-raised/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 overflow-x-auto px-6 py-3 sm:px-8">
        <nav aria-label="Command Center" className="flex items-center gap-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                  active ? "bg-ember text-ink" : "text-steel hover:text-chalk"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="whitespace-nowrap font-mono text-xs uppercase tracking-wider text-steel hover:text-rust">
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}
