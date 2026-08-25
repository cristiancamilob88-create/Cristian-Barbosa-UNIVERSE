import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit, testDateRange } from "@/server/db/testHelpers.integration";
import { FIRST_TOUCH_COOKIE, LAST_TOUCH_COOKIE, VISITOR_COOKIE } from "@/lib/attribution";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { classifyOutboundEvent } from "@/lib/socialPlatform";
import { getPerformanceByDimension } from "./performance";
import { getSocialPerformance } from "./social";
import { getQrPerformance } from "./qr";
import { getProductViews } from "./products";
import { getRevenueByProductAndOffer } from "./revenue";
import { getContactJourney } from "./journey";
import { POST as postLead } from "@/app/api/lead/route";

/**
 * Six worked-example journeys straight from the Block 03 brief's
 * "VALIDACIÓN MANUAL" section — run as automated, repeatable tests
 * instead of manual clicking, exercising the same real code paths
 * (including the actual /api/lead route handler for the two lead
 * flows). Test data only, per "no utilizar datos reales".
 */
function leadRequest(
  visitorId: string,
  sourceJson: string,
  body: Record<string, unknown>,
): NextRequest {
  const cookie = [
    `${VISITOR_COOKIE}=${visitorId}`,
    `${LAST_TOUCH_COOKIE}=${encodeURIComponent(sourceJson)}`,
    `${FIRST_TOUCH_COOKIE}=${encodeURIComponent(sourceJson)}`,
  ].join("; ");

  return new NextRequest("https://cristianbarbosa.test/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

describe("Block 03 manual validation journeys", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("TEST 1: Instagram -> /entrenar -> CTA -> Facebook", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, {
        utmSource: "instagram",
        utmMedium: "social",
        utmCampaign: "training-2026",
        utmContent: "reel-01",
        landingPath: "/entrenar",
      });
      await recordInteraction(client, { visitorId, contactId: null, eventName: "landing_view", route: "/entrenar", touch });
      await recordInteraction(client, { visitorId, contactId: null, eventName: "cta_click", route: "/entrenar", touch, metadata: { cta: "ver_facebook" } });
      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: classifyOutboundEvent("facebook"),
        route: "/go/facebook-subscription",
        touch,
        metadata: { platform: "facebook", slug: "facebook-subscription" },
      });

      // Same connection for the read as the writes — see the Block 03
      // report on the intermittent-visibility issue this avoids.
      const sources = await getPerformanceByDimension(client, "source", testDateRange());
      expect(sources.find((r) => r.label === "Instagram")?.visitors).toBe(1);

      const social = await getSocialPerformance(client, testDateRange());
      expect(social.find((r) => r.platform === "facebook")?.clicks).toBe(1);
    } finally {
      client.release();
    }
  });

  it("TEST 2: TikTok -> /musica -> CTA", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, {
        utmSource: "tiktok",
        utmMedium: "social",
        utmCampaign: "music-launch",
        landingPath: "/musica",
      });
      await recordInteraction(client, { visitorId, contactId: null, eventName: "landing_view", route: "/musica", touch });
      await recordInteraction(client, { visitorId, contactId: null, eventName: "cta_click", route: "/musica", touch, metadata: { cta: "early_access" } });

      const sources = await getPerformanceByDimension(client, "source", testDateRange());
      expect(sources.find((r) => r.label === "TikTok")?.visitors).toBe(1);
    } finally {
      client.release();
    }
  });

  it("TEST 3: YouTube -> /shows", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, {
        utmSource: "youtube",
        utmMedium: "video",
        landingPath: "/shows",
      });
      await recordInteraction(client, { visitorId, contactId: null, eventName: "landing_view", route: "/shows", touch });

      const sources = await getPerformanceByDimension(client, "source", testDateRange());
      expect(sources.find((r) => r.label === "YouTube")?.visitors).toBe(1);
    } finally {
      client.release();
    }
  });

  it("TEST 4: QR Aura -> /entrenar -> WhatsApp -> lead", async () => {
    const sourceRef = {
      utmSource: "event",
      utmMedium: "qr",
      utmCampaign: "aura-2026",
      utmContent: null,
      utmTerm: null,
      qrSlug: "aura-2026-main",
      channel: "qr",
      landingPath: "/entrenar",
      referrer: null,
      capturedAt: new Date().toISOString(),
    };
    const email = `test4-${Date.now()}@example.com`;

    // Real proxy-equivalent + client flow: the landing page's own request
    // creates the `visitor` row and resolves the QR touch (mirrors
    // resolveVisitorContext — see docs/ATTRIBUTION.md) before the lead
    // form is ever submitted.
    const landingClient = await getTestPool().connect();
    let visitorId: string;
    try {
      const visit = await simulateVisit(
        landingClient,
        {
          utmSource: sourceRef.utmSource,
          utmMedium: sourceRef.utmMedium,
          utmCampaign: sourceRef.utmCampaign,
          qrSlug: sourceRef.qrSlug,
          landingPath: sourceRef.landingPath,
        },
        new Date(sourceRef.capturedAt),
      );
      visitorId = visit.visitorId;
      await recordInteraction(landingClient, {
        visitorId,
        contactId: null,
        eventName: "landing_view",
        route: "/entrenar",
        touch: visit.touch,
      });
    } finally {
      landingClient.release();
    }

    const response = await postLead(
      leadRequest(visitorId, JSON.stringify(sourceRef), {
        name: "Test Four",
        email,
        phone: "3001234567",
        topic: "entrenar",
      }),
    );
    expect(response.status).toBe(200);

    const qrPerformance = await getQrPerformance(getTestPool(), testDateRange());
    const auraRow = qrPerformance.find((r) => r.qrSlug === "aura-2026-main");
    expect(auraRow?.leads).toBe(1);

    const contactRows = await getTestPool().query("select id from contact where email = $1", [email]);
    const journey = await getContactJourney(getTestPool(), contactRows.rows[0].id);
    expect(journey.map((s) => s.eventName)).toContain("lead_submitted");
    expect(journey.map((s) => s.eventName)).toContain("contact_created");
    expect(journey.every((s) => s.qrSlug === "aura-2026-main" || s.eventName === "landing_view")).toBe(true);
  });

  it("TEST 5: WhatsApp -> /comunidad -> lead", async () => {
    const sourceRef = {
      utmSource: "whatsapp",
      utmMedium: "referral",
      utmCampaign: "community",
      utmContent: null,
      utmTerm: null,
      qrSlug: null,
      channel: "referral",
      landingPath: "/comunidad",
      referrer: null,
      capturedAt: new Date().toISOString(),
    };
    const visitorId = crypto.randomUUID();
    const email = `test5-${Date.now()}@example.com`;

    const response = await postLead(
      leadRequest(visitorId, JSON.stringify(sourceRef), {
        name: "Test Five",
        email,
        phone: "3007654321",
        topic: "general",
      }),
    );
    expect(response.status).toBe(200);

    const sources = await getPerformanceByDimension(getTestPool(), "source", testDateRange());
    const whatsappRow = sources.find((r) => r.label === "WhatsApp");
    expect(whatsappRow?.leads).toBeGreaterThanOrEqual(1);
  });

  it("TEST 6: Evento -> QR -> /productos -> product view -> purchase simulada", async () => {
    const client = await getTestPool().connect();
    try {
      // qr_source is a dictionary table resetActivityTables() deliberately
      // leaves in place (like source/campaign/interest) — upsert so this
      // test is safe to re-run against a DB that already has this row.
      const qr = await client.query(
        `insert into qr_source (slug, destination_path) values ('test-event-productos', '/productos')
         on conflict (slug) do update set destination_path = excluded.destination_path
         returning id`,
      );
      const qrId = qr.rows[0].id;
      const product = await client.query("select id, slug from product where slug = 'digital-course'");
      const offer = await client.query("select id from offer where slug = 'digital-course-standard'");
      const productId = product.rows[0].id;
      const offerId = offer.rows[0].id;

      const { visitorId, touch } = await simulateVisit(client, {
        utmSource: "event",
        utmMedium: "qr",
        utmCampaign: "product-fair-2026",
        qrSlug: "test-event-productos",
        landingPath: "/productos",
      });
      expect(touch.qrId).toBe(qrId);

      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "landing_view",
        route: "/productos",
        touch,
      });
      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "product_view",
        route: "/productos",
        touch,
        entity: { type: "product", id: productId },
      });

      // Simulated purchase — no real checkout in this block (see docs/CRM.md).
      const contactResult = await client.query(
        `insert into contact (email, first_touch_source_id, first_touch_campaign_id, first_touch_qr_id, first_touch_captured_at)
         values ($1, $2, $3, $4, now()) returning id`,
        [`test6-${Date.now()}@example.com`, touch.sourceId, touch.campaignId, touch.qrId],
      );
      const contactId = contactResult.rows[0].id;
      await client.query("insert into contact_visitor (visitor_id, contact_id) values ($1, $2)", [visitorId, contactId]);

      const orderResult = await client.query(
        `insert into orders (contact_id, status, total_cents, paid_at) values ($1, 'paid', 89900, now()) returning id`,
        [contactId],
      );
      await client.query(
        "insert into order_items (order_id, offer_id, unit_price_cents) values ($1, $2, 89900)",
        [orderResult.rows[0].id, offerId],
      );

      const productViews = await getProductViews(client, testDateRange());
      expect(productViews.find((r) => r.productSlug === "digital-course")?.views).toBe(1);

      const revenue = await getRevenueByProductAndOffer(client, testDateRange());
      const courseRevenue = revenue.find((r) => r.productSlug === "digital-course");
      expect(courseRevenue?.purchases).toBe(1);
      expect(courseRevenue?.revenueCents).toBe(89900);

      const qrPerformance = await getQrPerformance(client, testDateRange());
      const eventQrRow = qrPerformance.find((r) => r.qrSlug === "test-event-productos");
      expect(eventQrRow?.visits).toBe(1);
      expect(eventQrRow?.purchases).toBe(1);
      expect(eventQrRow?.revenueCents).toBe(89900);
    } finally {
      client.release();
    }
  });
});
