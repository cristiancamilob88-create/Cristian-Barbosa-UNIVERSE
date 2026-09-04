import { describe, expect, it } from "vitest";
import { buildQrDestinationUrl } from "./qrImage";

describe("buildQrDestinationUrl", () => {
  it("builds the real destination URL with the attribution params src/lib/attribution.ts resolves", () => {
    const url = buildQrDestinationUrl("https://cristian-barbosa-universe.vercel.app", {
      slug: "concordia-2026",
      destinationPath: "/bienvenida/concordia-2026",
      active: true,
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://cristian-barbosa-universe.vercel.app/bienvenida/concordia-2026",
    );
    expect(parsed.searchParams.get("utm_medium")).toBe("qr");
    expect(parsed.searchParams.get("qr")).toBe("concordia-2026");
    expect(parsed.searchParams.get("utm_campaign")).toBe("concordia-2026");
    expect(parsed.searchParams.get("utm_source")).toBe("qr");
  });

  it("works for a destination that isn't a /bienvenida landing (e.g. an existing commercial route)", () => {
    const url = buildQrDestinationUrl("https://cristian-barbosa-universe.vercel.app", {
      slug: "aura-2026-main",
      destinationPath: "/entrenar",
      active: true,
    });

    expect(url).toBe(
      "https://cristian-barbosa-universe.vercel.app/entrenar?utm_source=qr&utm_medium=qr&utm_campaign=aura-2026-main&qr=aura-2026-main",
    );
  });
});
