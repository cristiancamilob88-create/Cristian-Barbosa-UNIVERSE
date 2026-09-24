import { describe, it, expect } from "vitest";
import { buildMetadata } from "./seo";

describe("buildMetadata", () => {
  it("gives every page the shared share image, not just the homepage", () => {
    const metadata = buildMetadata({ title: "Shows", description: "d", path: "/shows" });
    expect(metadata.openGraph?.images).toEqual([expect.objectContaining({ url: "/opengraph-image.jpg" })]);
    expect(metadata.twitter?.images).toEqual([expect.objectContaining({ url: "/opengraph-image.jpg" })]);
  });

  it("uses the layout's title template by default and the full name on share cards", () => {
    const metadata = buildMetadata({ title: "Shows", description: "d", path: "/shows" });
    expect(metadata.title).toBe("Shows");
    expect(metadata.openGraph?.title).toBe("Shows — Cristian Barbosa");
  });

  it("skips the template for a title that already names Cristian", () => {
    const metadata = buildMetadata({
      title: "Historia de Cristian Barbosa",
      absoluteTitle: true,
      description: "d",
      path: "/about",
    });
    expect(metadata.title).toEqual({ absolute: "Historia de Cristian Barbosa" });
    expect(metadata.openGraph?.title).toBe("Historia de Cristian Barbosa");
  });

  it("marks a campaign landing noindex and points canonical at its own URL", () => {
    const metadata = buildMetadata({ title: "Bienvenida", description: "d", path: "/bienvenida/x", noindex: true });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBe("https://cristianbarbosa.com/bienvenida/x");
  });
});
