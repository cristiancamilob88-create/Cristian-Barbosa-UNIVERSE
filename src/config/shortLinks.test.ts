import { describe, it, expect } from "vitest";
import { shortLinkDestination, shortLinks } from "./shortLinks";
import { navItems, secondaryNavItems } from "./site";

describe("shortLinks", () => {
  it("are unique and never shadow a real page", () => {
    const paths = shortLinks.map((l) => l.path);
    expect(new Set(paths).size).toBe(paths.length);
    const pages = [...navItems, ...secondaryNavItems].map((i) => i.href.split("#")[0]);
    for (const path of paths) {
      expect(path).toMatch(/^\/[a-z]{2,4}$/);
      expect(pages).not.toContain(path);
    }
  });

  it("land on the page with network, placement and campaign tagged", () => {
    const ig = shortLinks.find((l) => l.path === "/ig")!;
    expect(shortLinkDestination(ig)).toBe("/?utm_source=instagram&utm_medium=bio&utm_campaign=perfil");
  });
});
