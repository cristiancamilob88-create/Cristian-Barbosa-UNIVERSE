import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { GoLink } from "@/components/ui/GoLink";
import { navItems, secondaryNavItems, siteConfig, goLinks } from "@/config/site";
import { legalEntity, legalLinks } from "@/config/legal";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-steel-dim/40">
      <Container className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="" aria-hidden="true" width={32} height={32} className="rounded-sm" />
            <p className="font-display text-2xl font-black uppercase tracking-tight text-chalk">
              {siteConfig.name}
            </p>
          </div>
          <p className="mt-3 max-w-xs text-sm text-steel">{siteConfig.tagline}</p>
        </div>

        <nav aria-label="Universo" className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wider text-steel-dim">Universo</p>
          {[...navItems, ...secondaryNavItems].map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-steel hover:text-chalk">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wider text-steel-dim">Conecta</p>
          <GoLink slug={goLinks.whatsappCommunity} className="text-sm text-steel hover:text-ember">
            WhatsApp
          </GoLink>
          <GoLink slug={goLinks.instagram} className="text-sm text-steel hover:text-ember">
            Instagram
          </GoLink>
          <GoLink slug={goLinks.tiktok} className="text-sm text-steel hover:text-ember">
            TikTok
          </GoLink>
          <GoLink slug={goLinks.youtube} className="text-sm text-steel hover:text-ember">
            YouTube
          </GoLink>
          <GoLink slug={goLinks.x} className="text-sm text-steel hover:text-ember">
            X (Twitter)
          </GoLink>
          <GoLink slug={goLinks.linkedin} className="text-sm text-steel hover:text-ember">
            LinkedIn
          </GoLink>
        </div>

        {/*
          Support/donate block, added 2026-08-28 at Cristian's request,
          promoted from a tiny link in the bottom bar (his own words:
          "está muy escondido") into its own labeled column here — same
          visual tier as Universo/Conecta, not just a footnote. Still
          deliberately NOT on /shows or any commercial page (his earlier
          framing: it shouldn't compete with "hire me" CTAs) — the
          Footer is the one place it's guaranteed to show up on every
          page without getting in front of a real commercial CTA.
          Ember-colored (not the muted steel the other columns use) so
          it actually stands out, per his "más relevante" ask.
        */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wider text-steel-dim">Apóyame</p>
          <GoLink slug={goLinks.paypalDonate} className="text-sm font-semibold text-ember hover:text-chalk">
            PayPal
          </GoLink>
          <GoLink slug={goLinks.nequiDonate} className="text-sm font-semibold text-ember hover:text-chalk">
            Nequi
          </GoLink>
        </div>
      </Container>

      <Container className="flex flex-wrap items-center justify-between gap-2 border-t border-steel-dim/40 py-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-steel-dim">
            © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
          </p>
          {/* Seller/data-controller identity — required on a site that
              sells online and collects personal data (Ley 1480 art. 50,
              Ley 1581). Source: src/config/legal.ts. */}
          <p className="text-xs text-steel-dim">
            {legalEntity.name} · {legalEntity.documentLabel} {legalEntity.documentNumber} ·{" "}
            {legalEntity.country} · {legalEntity.email}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-steel-dim hover:text-steel">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {/*
          Admin login link, added 2026-08-25 at Cristian's own request —
          he needs a findable way back into /admin without remembering
          the URL, now that it's the real day-to-day Command Center.
          Deliberately NOT a navItems/secondaryNavItems entry (those
          drive the homepage pillar grid and require a commercial
          `intent` phrase — a login link isn't a customer-facing
          intention) and deliberately NOT a TrackedLink (that's for
          commercial CTAs; /admin traffic is excluded from analytics on
          purpose — see PageViewTracker.tsx, "Why /admin isn't
          tracked"). A plain, muted Link, same tier as the copyright
          line above — visible, but not competing with any real CTA.
        */}
        <Link href="/admin/login" className="text-xs text-steel-dim hover:text-steel">
          Login administrador
        </Link>
      </Container>
    </footer>
  );
}
