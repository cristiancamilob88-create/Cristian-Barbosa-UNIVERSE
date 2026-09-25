import type { MetadataRoute } from "next";
import { navItems, secondaryNavItems, siteConfig } from "@/config/site";
import { legalLinks } from "@/config/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  // A navItem can point at an anchor within another page (e.g.
  // /entrenar#coaching, added 2026-08-28) instead of its own route — an
  // anchor isn't a separate crawlable resource, so it's stripped before
  // building the sitemap; the Set dedupes it against the real /entrenar
  // entry that's already in this same list.
  const allHrefs = [...navItems.map((item) => item.href), ...secondaryNavItems.map((item) => item.href)];
  const routes = [
    "/",
    ...new Set(allHrefs.map((href) => href.split("#")[0])),
    ...legalLinks.map((link) => link.href),
  ];

  return routes.map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
