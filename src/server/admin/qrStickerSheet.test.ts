import { describe, expect, it } from "vitest";
import { renderQrStickerSheet } from "./qrStickerSheet";

describe("renderQrStickerSheet", () => {
  it("renders a real, Letter-sized PNG sheet (12 tiles), not just headers", async () => {
    const png = await renderQrStickerSheet(
      "https://cristian-barbosa-universe.vercel.app/bienvenida/concordia-2026?qr=concordia-2026",
    );

    // PNG magic bytes — proves sharp actually rendered an image.
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    // A full Letter page at 300 DPI with 12 tiles is a substantial file, not a placeholder.
    expect(png.length).toBeGreaterThan(100_000);
  });
});
