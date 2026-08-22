import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "../testHelpers.integration";
import { resolveSourceId, resolveCampaignId, resolveQrId, resolveInterestId } from "./reference";

describe("reference resolvers", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("resolves a seeded source by slug", async () => {
    const client = await getTestPool().connect();
    try {
      const id = await resolveSourceId(client, "instagram");
      expect(id).not.toBeNull();
      const again = await resolveSourceId(client, "instagram");
      expect(again).toBe(id);
    } finally {
      client.release();
    }
  });

  it("extends the source dictionary with an unrecognized slug instead of rejecting it", async () => {
    const client = await getTestPool().connect();
    try {
      const slug = `pinterest-${Date.now()}`;
      const id = await resolveSourceId(client, slug);
      expect(id).not.toBeNull();

      const row = await client.query("select category from source where id = $1", [id]);
      expect(row.rows[0].category).toBe("other");
    } finally {
      client.release();
    }
  });

  it("extends the campaign dictionary the same way", async () => {
    const client = await getTestPool().connect();
    try {
      const slug = `pop-up-${Date.now()}`;
      const id = await resolveCampaignId(client, slug);
      expect(id).not.toBeNull();
      const again = await resolveCampaignId(client, slug);
      expect(again).toBe(id);
    } finally {
      client.release();
    }
  });

  it("resolves a seeded qr_source but never auto-creates an unknown one", async () => {
    const client = await getTestPool().connect();
    try {
      const known = await resolveQrId(client, "aura-2026-main");
      expect(known).not.toBeNull();

      const unknown = await resolveQrId(client, "does-not-exist");
      expect(unknown).toBeNull();

      const stillNone = await client.query("select id from qr_source where slug = 'does-not-exist'");
      expect(stillNone.rowCount).toBe(0);
    } finally {
      client.release();
    }
  });

  it("resolves a seeded interest but never auto-creates an unknown one", async () => {
    const client = await getTestPool().connect();
    try {
      expect(await resolveInterestId(client, "training")).not.toBeNull();
      expect(await resolveInterestId(client, "not-a-real-interest")).toBeNull();
    } finally {
      client.release();
    }
  });

  it("treats a SQL-metacharacter-laden slug as inert data, not a statement", async () => {
    const client = await getTestPool().connect();
    try {
      const malicious = "x'); drop table contact; --";
      const id = await resolveSourceId(client, malicious);
      expect(id).not.toBeNull();

      const row = await client.query("select slug from source where id = $1", [id]);
      expect(row.rows[0].slug).toBe(malicious.toLowerCase());

      // The contact table must still exist and be queryable.
      await expect(client.query("select count(*) from contact")).resolves.toBeDefined();
    } finally {
      client.release();
    }
  });
});
