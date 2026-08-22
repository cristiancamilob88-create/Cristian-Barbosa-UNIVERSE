import type { MetadataRoute } from "next";
import { navItems, secondaryNavItems, siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", ...navItems.map((item) => item.href), ...secondaryNavItems.map((item) => item.href)];

  return routes.map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
