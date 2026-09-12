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

  it("resolves collaborator fields (0013) when a campaign has them set", async () => {
    const client = await getTestPool().connect();
    let slug: string;
    try {
      const suffix = Date.now();
      const campaignSlug = `collab-campaign-${suffix}`;
      const qrSlug = `collab-qr-${suffix}`;
      slug = qrSlug;
      const campaignResult = await client.query<{ id: string }>(
        `insert into campaign (slug, name, collaborator_name, collaborator_role, collaborator_url, collaborator_image_url)
         values ($1, 'Test Collab Campaign', 'José Miguel', 'Globo de la muerte', 'https://www.tiktok.com/@josemiguel_bmx', '/brand/cristian-jose-globo-muerte.jpg')
         returning id`,
        [campaignSlug],
      );
      const campaignId = campaignResult.rows[0].id;
      await client.query("insert into qr_source (slug, campaign_id, destination_path) values ($1, $2, '/')", [
        qrSlug,
        campaignId,
      ]);
    } finally {
      client.release();
    }

    const landing = await getActiveQrLanding(getTestPool(), slug);
    expect(landing).not.toBeNull();
    expect(landing?.collaboratorName).toBe("José Miguel");
    expect(landing?.collaboratorRole).toBe("Globo de la muerte");
    expect(landing?.collaboratorUrl).toBe("https://www.tiktok.com/@josemiguel_bmx");
    expect(landing?.collaboratorImageUrl).toBe("/brand/cristian-jose-globo-muerte.jpg");
  });

  it("returns null collaborator fields for a campaign without them set, not a crash", async () => {
    const landing = await getActiveQrLanding(getTestPool(), "colegio-la-leticia-2026");
    expect(landing).not.toBeNull();
    expect(landing?.collaboratorName).toBeNull();
    expect(landing?.collaboratorUrl).toBeNull();
  });
});
