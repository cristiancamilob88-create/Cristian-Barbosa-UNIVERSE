import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "../testHelpers.integration";
import { resolveTouch } from "./reference";
import { recordVisitorTouch, getVisitor } from "./visitor";
import { findOrCreateContact, assignInterest } from "./contact";
import { resolveInterestId } from "./reference";

async function makeVisitorWithTouch(client: import("pg").PoolClient, landingPath: string, capturedAt: string) {
  const visitorId = randomUUID();
  const touch = await resolveTouch(client, {
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: "aura-2026",
    utmContent: null,
    utmTerm: null,
    qrSlug: null,
    channel: "organic_social",
    landingPath,
    referrer: null,
    capturedAt,
  });
  await recordVisitorTouch(client, visitorId, touch);
  const visitor = await getVisitor(client, visitorId);
  if (!visitor) throw new Error("visitor missing");
  return visitor;
}

describe("contact repository", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("creates a new contact on first sight, copying first- and last-touch from the visitor", async () => {
    const client = await getTestPool().connect();
    try {
      const email = `dedup-${Date.now()}@example.com`;
      const visitor = await makeVisitorWithTouch(client, "/entrenar", "2026-01-01T00:00:00.000Z");

      const { contact, created } = await findOrCreateContact(client, { email, phone: null, name: "Ana" }, visitor);
      expect(created).toBe(true);
      expect(contact.email).toBe(email);

      const row = await client.query(
        "select first_touch_landing_path, last_touch_landing_path from contact where id = $1",
        [contact.id],
      );
      expect(row.rows[0].first_touch_landing_path).toBe("/entrenar");
      expect(row.rows[0].last_touch_landing_path).toBe("/entrenar");
    } finally {
      client.release();
    }
  });

  it("deduplicates by email (case-insensitive) instead of creating a second contact", async () => {
    const client = await getTestPool().connect();
    try {
      const email = `Dedup2-${Date.now()}@Example.com`;
      const visitor1 = await makeVisitorWithTouch(client, "/entrenar", "2026-01-01T00:00:00.000Z");
      const { contact: first } = await findOrCreateContact(client, { email, phone: null, name: "Ana" }, visitor1);

      const visitor2 = await makeVisitorWithTouch(client, "/productos", "2026-02-01T00:00:00.000Z");
      const { contact: second, created } = await findOrCreateContact(
        client,
        { email: email.toLowerCase(), phone: null, name: null },
        visitor2,
      );

      expect(created).toBe(false);
      expect(second.id).toBe(first.id);
    } finally {
      client.release();
    }
  });

  it("preserves first-touch and only refreshes last-touch on a returning contact", async () => {
    const client = await getTestPool().connect();
    try {
      const email = `preserve-${Date.now()}@example.com`;
      const visitor1 = await makeVisitorWithTouch(client, "/entrenar", "2026-01-01T00:00:00.000Z");
      await findOrCreateContact(client, { email, phone: null, name: "Ana" }, visitor1);

      const visitor2 = await makeVisitorWithTouch(client, "/musica", "2026-03-01T00:00:00.000Z");
      const { contact } = await findOrCreateContact(client, { email, phone: null, name: null }, visitor2);

      const row = await client.query(
        "select first_touch_landing_path, first_touch_captured_at, last_touch_landing_path, last_touch_captured_at from contact where id = $1",
        [contact.id],
      );
      expect(row.rows[0].first_touch_landing_path).toBe("/entrenar");
      expect(new Date(row.rows[0].first_touch_captured_at).toISOString()).toBe("2026-01-01T00:00:00.000Z");
      expect(row.rows[0].last_touch_landing_path).toBe("/musica");
      expect(new Date(row.rows[0].last_touch_captured_at).toISOString()).toBe("2026-03-01T00:00:00.000Z");
    } finally {
      client.release();
    }
  });

  it("rejects a direct attempt to overwrite first_touch_captured_at at the DB level", async () => {
    const client = await getTestPool().connect();
    try {
      const email = `trigger-${Date.now()}@example.com`;
      const visitor = await makeVisitorWithTouch(client, "/entrenar", "2026-01-01T00:00:00.000Z");
      const { contact } = await findOrCreateContact(client, { email, phone: null, name: "Ana" }, visitor);

      await expect(
        client.query("update contact set first_touch_captured_at = now() where id = $1", [contact.id]),
      ).rejects.toThrow(/immutable/);
    } finally {
      client.release();
    }
  });

  it("assigns an interest to a contact, idempotently", async () => {
    const client = await getTestPool().connect();
    try {
      const email = `interest-${Date.now()}@example.com`;
      const visitor = await makeVisitorWithTouch(client, "/entrenar", "2026-01-01T00:00:00.000Z");
      const { contact } = await findOrCreateContact(client, { email, phone: null, name: "Ana" }, visitor);

      const interestId = await resolveInterestId(client, "training");
      if (!interestId) throw new Error("seed missing training interest");

      await assignInterest(client, contact.id, interestId);
      await assignInterest(client, contact.id, interestId); // idempotent, no duplicate row

      const rows = await client.query("select * from contact_interest where contact_id = $1", [contact.id]);
      expect(rows.rowCount).toBe(1);
    } finally {
      client.release();
    }
  });
});
