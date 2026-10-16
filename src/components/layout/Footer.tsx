import Link from "next/link";
import { GoLink } from "@/components/ui/GoLink";
import { navItems, secondaryNavItems, siteConfig, goLinks } from "@/config/site";
import { legalEntity, legalLinks } from "@/config/legal";

/**
 * Footer, redesigned 2026-10-16 (taste-skill, "Name first, places under
 * it"): the name opens the close at full width, cropped by the field's
 * bottom edge, then the ways to reach Cristian large in the accent, then
 * small link columns and the legal row. Inverse field (chalk on ink
 * pages). Keeps everything the old footer carried: the universe links,
 * channels, donate links, legal links, the city and the admin login.
 */
export function Footer() {
  const allPages = [...navItems, ...secondaryNavItems];
  return (
    <footer className="mt-24 bg-chalk text-ink">
      <div className="overflow-hidden pt-8">
        <p
          aria-hidden="true"
          className="-mb-[0.12em] px-5 font-display text-[25vw] font-black uppercase leading-[0.82] tracking-[-0.04em] sm:px-8 lg:whitespace-nowrap lg:px-2 lg:text-center lg:text-[15.5vw]"
        >
          {siteConfig.name}
        </p>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pb-10 pt-[72px] sm:px-8 lg:grid-cols-12">
        <nav aria-label="Escríbeme" className="flex flex-col gap-1 lg:col-span-5">
          <GoLink slug={goLinks.whatsappCommercial} className="font-display text-[26px] font-black uppercase leading-tight text-ember hover:text-ink sm:text-[34px]">
            WhatsApp
          </GoLink>
          <GoLink slug={goLinks.instagram} className="font-display text-[26px] font-black uppercase leading-tight text-ember hover:text-ink sm:text-[34px]">
            Instagram
          </GoLink>
          <GoLink slug={goLinks.tiktok} className="font-display text-[26px] font-black uppercase leading-tight text-ember hover:text-ink sm:text-[34px]">
            TikTok
          </GoLink>
          <GoLink slug={goLinks.youtube} className="font-display text-[26px] font-black uppercase leading-tight text-ember hover:text-ink sm:text-[34px]">
            YouTube
          </GoLink>
          <p className="mt-3 text-[15px]">{legalEntity.city}</p>
        </nav>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          <nav aria-label="Universo" className="flex flex-col gap-2 text-[15px]">
            <p className="font-semibold">El sitio</p>
            {allPages.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-ember">
                {item.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Más redes" className="flex flex-col gap-2 text-[15px]">
            <p className="font-semibold">Más redes</p>
            <GoLink slug={goLinks.whatsappCommunity} className="hover:text-ember">Comunidad de WhatsApp</GoLink>
            <GoLink slug={goLinks.x} className="hover:text-ember">X (Twitter)</GoLink>
            <GoLink slug={goLinks.linkedin} className="hover:text-ember">LinkedIn</GoLink>
          </nav>
          {/* Donate links: Cristian asked (2026-08-28) for them to stand
              out — kept in the accent, never on a commercial page. */}
          <nav aria-label="Apóyame" className="flex flex-col gap-2 text-[15px]">
            <p className="font-semibold">Apóyame</p>
            <GoLink slug={goLinks.paypalDonate} className="font-semibold text-ember hover:text-ink">PayPal</GoLink>
            <GoLink slug={goLinks.nequiDonate} className="font-semibold text-ember hover:text-ink">Nequi</GoLink>
          </nav>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-4 px-5 pb-8 pt-16 text-[13px] sm:px-8">
        <div className="flex flex-col gap-1">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-ember">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Admin login: Cristian's way back into /admin (2026-08-25). */}
        <Link href="/admin/login" className="hover:text-ember">
          Login administrador
        </Link>
      </div>
    </footer>
  );
}
