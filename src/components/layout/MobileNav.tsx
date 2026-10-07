"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { contactNavItem, moreNavItems, primaryNavItems } from "@/config/site";

/**
 * Block 08 mobile-navigability fix (docs/MASTER_BRIEF_BLOCK_08.md,
 * "13. MOBILE — PRIORIDAD ALTA"): `Header`'s nav was `hidden lg:flex`/
 * `hidden sm:flex` with no mobile fallback at all — on a phone, the
 * only way to reach any other route was scrolling all the way down to
 * `Footer`'s nav. Given the brief's own "el tráfico llegará
 * principalmente desde redes sociales," that's a real navigability
 * bug, not a cosmetic gap. This is the one client component the mobile
 * nav needs — a plain toggle button + a full-screen panel, no motion
 * library, no heavy JS (AGENTS.md: no 3D/heavy motion without checking
 * ARCHITECTURE.md first — this doesn't need any).
 *
 * The panel renders through a portal into `document.body`, not inline
 * inside `<header>` — `Header`'s own `backdrop-blur` class
 * (`backdrop-filter`) makes it a CSS containing block for any
 * `position: fixed` descendant (same rule as `transform`/`filter`/
 * `contain`), which silently capped the panel to the header's own
 * 64px height instead of the viewport. Confirmed by measuring the
 * rendered box before/after moving it out of `header` — not a guess.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 text-chalk"
      >
        <span
          className={`block h-0.5 w-6 bg-current transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
        />
        <span className={`block h-0.5 w-6 bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
        <span
          className={`block h-0.5 w-6 bg-current transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div id="mobile-nav-panel" className="fixed inset-0 z-30 overflow-y-auto bg-ink pt-16">
            {/* 2026-10-07: the 4 paths + the map big, the rest under "Más". */}
            <nav aria-label="Principal (mobile)" className="flex flex-col px-4 pb-10">
              <div className="flex flex-col divide-y divide-steel-dim/30">
                {primaryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="py-4 font-display text-2xl font-black uppercase tracking-tight text-chalk transition-colors hover:text-ember"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link
                href={contactNavItem.href}
                onClick={() => setOpen(false)}
                className="mt-4 border border-ember px-4 py-3 text-center font-mono text-sm uppercase tracking-wider text-ember"
              >
                {contactNavItem.label}
              </Link>
              <p className="mt-8 font-mono text-xs uppercase tracking-widest text-steel-dim">Más</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4">
                {moreNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="py-2.5 text-sm text-steel transition-colors hover:text-chalk"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
