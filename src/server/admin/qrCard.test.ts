import { describe, expect, it } from "vitest";
import { renderQrCard } from "./qrCard";

describe("renderQrCard", () => {
  it("renders a real PNG (logo + QR composited), not just headers", async () => {
    const png = await renderQrCard("https://cristian-barbosa-universe.vercel.app/bienvenida/concordia-2026?qr=concordia-2026");

    // PNG magic bytes — proves sharp actually rendered an image.
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    // Sanity: a composited card is a real, non-trivial image, not a 1x1 placeholder.
    expect(png.length).toBeGreaterThan(50_000);
  });
});
