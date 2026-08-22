import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { navItems, secondaryNavItems, siteConfig, socialLinks } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-steel-dim/40">
      <Container className="grid gap-10 py-16 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-black uppercase tracking-tight text-chalk">
            {siteConfig.name}
          </p>
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
          <TrackedLink
            event={{ name: "whatsapp_click", topic: "footer" }}
            href={socialLinks.whatsapp}
            external
            className="text-sm text-steel hover:text-ember"
          >
            WhatsApp
          </TrackedLink>
          <TrackedLink
            event={{ name: "social_click", network: "instagram" }}
            href={socialLinks.instagram}
            external
            className="text-sm text-steel hover:text-ember"
          >
            Instagram
          </TrackedLink>
          <TrackedLink
            event={{ name: "social_click", network: "tiktok" }}
            href={socialLinks.tiktok}
            external
            className="text-sm text-steel hover:text-ember"
          >
            TikTok
          </TrackedLink>
          <TrackedLink
            event={{ name: "social_click", network: "youtube" }}
            href={socialLinks.youtube}
            external
            className="text-sm text-steel hover:text-ember"
          >
            YouTube
          </TrackedLink>
        </div>
      </Container>

      <Container className="border-t border-steel-dim/40 py-6">
        <p className="text-xs text-steel-dim">
          © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
        </p>
      </Container>
    </footer>
  );
}
