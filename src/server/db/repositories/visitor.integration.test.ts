import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "../testHelpers.integration";
import { resolveTouch } from "./reference";
import {
  ensureVisitor,
  recordVisitorTouch,
  getVisitor,
  linkVisitorToContact,
  findContactIdForVisitor,
} from "./visitor";
import { recordInteraction } from "./interaction";

describe("visitor repository", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("creates a visitor row lazily and bumps last_seen_at on ensureVisitor", async () => {
    const client = await getTestPool().connect();
    try {
      const visitorId = randomUUID();
      await ensureVisitor(client, visitorId);
      const visitor = await getVisitor(client, visitorId);
      expect(visitor).not.toBeNull();
      expect(visitor?.first_touch_captured_at).toBeNull();
    } finally {
      client.release();
    }
  });

  it("sets first-touch on the very first attributed visit and never again", async () => {
    const client = await getTestPool().connect();
    try {
      const visitorId = randomUUID();

      const firstTouch = await resolveTouch(client, {
        utmSource: "instagram",
        utmMedium: "social",
        utmCampaign: "aura-2026",
        utmContent: null,
        utmTerm: null,
        qrSlug: null,
        channel: "organic_social",
        landingPath: "/entrenar",
        referrer: null,
        capturedAt: "2026-01-01T00:00:00.000Z",
      });
      await recordVisitorTouch(client, visitorId, firstTouch);

      const secondTouch = await resolveTouch(client, {
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "brand-search",
        utmContent: null,
        utmTerm: null,
        qrSlug: null,
        channel: "search",
        landingPath: "/productos",
        referrer: null,
        capturedAt: "2026-01-05T00:00:00.000Z",
      });
      await recordVisitorTouch(client, visitorId, secondTouch);

      const visitor = await getVisitor(client, visitorId);
      expect(visitor?.first_touch_landing_path).toBe("/entrenar");
      expect(visitor?.first_touch_captured_at).toBe("2026-01-01T00:00:00.000Z");
      // Last touch DID move to the second visit.
      expect(visitor?.last_touch_landing_path).toBe("/productos");
      expect(visitor?.last_touch_captured_at).toBe("2026-01-05T00:00:00.000Z");
    } finally {
      client.release();
    }
  });

  it("backfills prior anonymous interactions once a visitor is linked to a contact", async () => {
    const client = await getTestPool().connect();
    try {
      const visitorId = randomUUID();
      const emptyTouch = await resolveTouch(client, null);
      await ensureVisitor(client, visitorId);

      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "page_view",
        route: "/entrenar",
        touch: emptyTouch,
      });
      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "social_click",
        route: "/entrenar",
        touch: emptyTouch,
        metadata: { platform: "instagram" },
      });

      const contactResult = await client.query(
        "insert into contact (email) values ($1) returning id",
        [`journey-${Date.now()}@example.com`],
      );
      const contactId = contactResult.rows[0].id as string;

      await linkVisitorToContact(client, visitorId, contactId);

      const linked = await findContactIdForVisitor(client, visitorId);
      expect(linked).toBe(contactId);

      const interactions = await client.query(
        "select event_name, contact_id from interaction where visitor_id = $1 order by created_at",
        [visitorId],
      );
      expect(interactions.rows).toHaveLength(2);
      expect(interactions.rows.every((row) => row.contact_id === contactId)).toBe(true);
    } finally {
      client.release();
    }
  });
});
