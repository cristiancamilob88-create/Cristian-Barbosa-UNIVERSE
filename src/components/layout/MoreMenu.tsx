"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { moreNavItems } from "@/config/site";

/**
 * Desktop "Más ▾" (2026-10-07 reorganization): the pages that left the
 * main menu — still one click away, never gone. Closes on outside click,
 * Escape and navigation.
 */
export function MoreMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="whitespace-nowrap font-mono text-xs uppercase tracking-wider text-steel transition-colors hover:text-ember"
      >
        Más {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-3 w-64 border border-steel-dim/50 bg-ink-raised py-2 shadow-xl">
          {moreNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 transition-colors hover:bg-ink"
            >
              <span className="block text-sm font-semibold text-chalk">{item.label}</span>
              <span className="block text-xs text-steel">{item.description}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
