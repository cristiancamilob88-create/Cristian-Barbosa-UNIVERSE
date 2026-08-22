import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GoLink } from "@/components/ui/GoLink";
import { navItems, secondaryNavItems, siteConfig, goLinks } from "@/config/site";

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
