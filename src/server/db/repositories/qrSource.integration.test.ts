import { afterAll, describe, expect, it } from "vitest";
import { getTestPool, closeTestPool } from "@/server/db/testHelpers.integration";
import { getActiveQrLanding } from "./qrSource";

describe("getActiveQrLanding", () => {
  afterAll(closeTestPool);

  it("resolves the seeded colegio-la-leticia-2026 QR with its campaign/source labels", async () => {
    const landing = await getActiveQrLanding(getTestPool(), "colegio-la-leticia-2026");
    expect(landing).not.toBeNull();
    expect(landing?.campaignName).toBe("Colegio de la Leticia — Envigado");
    expect(landing?.sourceLabel).toBe("Colegio");
  });

  it("is case/whitespace-insensitive, same convention as resolveQrId", async () => {
    const landing = await getActiveQrLanding(getTestPool(), "  Colegio-La-Leticia-2026  ");
    expect(landing?.slug).toBe("colegio-la-leticia-2026");
  });

  it("returns null for an unregistered slug — a QR must be pre-registered, never auto-created", async () => {
    const landing = await getActiveQrLanding(getTestPool(), "does-not-exist");
    expect(landing).toBeNull();
  });

  it("returns null for an inactive qr_source row", async () => {
    const client = await getTestPool().connect();
    let slug: string;
    try {
      slug = `inactive-qr-${Date.now()}`;
      await client.query("insert into qr_source (slug, destination_path, active) values ($1, '/', false)", [slug]);
    } finally {
      client.release();
    }

    const landing = await getActiveQrLanding(getTestPool(), slug);
    expect(landing).toBeNull();
  });

  it("returns null campaignName/sourceLabel for a QR with no campaign/source linked, not a crash", async () => {
    const client = await getTestPool().connect();
    let slug: string;
    try {
      slug = `no-links-qr-${Date.now()}`;
      await client.query("insert into qr_source (slug, destination_path) values ($1, '/')", [slug]);
    } finally {
      client.release();
    }

    const landing = await getActiveQrLanding(getTestPool(), slug);
    expect(landing).not.toBeNull();
    expect(landing?.campaignName).toBeNull();
    expect(landing?.sourceLabel).toBeNull();
  });
});
