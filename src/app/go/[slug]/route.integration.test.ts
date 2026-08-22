import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "@/server/db/testHelpers.integration";
import { GET } from "./route";

function makeRequest(slug: string, cookie = ""): NextRequest {
  return new NextRequest(`https://cristianbarbosa.test/go/${slug}`, {
    headers: cookie ? { cookie } : {},
  });
}

describe("GET /go/[slug]", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("redirects to the profile's real URL and records a social_click", async () => {
    const response = await GET(makeRequest("instagram-main"), {
      params: Promise.resolve({ slug: "instagram-main" }),
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("instagram.com");

    const rows = await getTestPool().query(
      "select event_name, metadata from interaction where event_name = 'social_click'",
    );
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].metadata).toMatchObject({ platform: "instagram", slug: "instagram-main" });
  });

  it("classifies the whatsapp platform as a whatsapp_click, not a social_click", async () => {
    await GET(makeRequest("whatsapp-community"), {
      params: Promise.resolve({ slug: "whatsapp-community" }),
    });

    const rows = await getTestPool().query("select event_name from interaction");
    expect(rows.rows.map((r) => r.event_name)).toEqual(["whatsapp_click"]);
  });

  it("falls back to /redes for an unknown or inactive slug, without crashing", async () => {
    const response = await GET(makeRequest("does-not-exist"), {
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/redes");

    const rows = await getTestPool().query("select count(*) from interaction");
    expect(Number(rows.rows[0].count)).toBe(0);
  });

  it("links the click to an already-identified contact when cb_visitor maps to one", async () => {
    const visitorId = "33333333-3333-4333-8333-333333333333";
    const contactRows = await getTestPool().query(
      "insert into contact (email) values ($1) returning id",
      [`gocontact-${Date.now()}@example.com`],
    );
    const contactId = contactRows.rows[0].id;
    await getTestPool().query("insert into visitor (id) values ($1)", [visitorId]);
    await getTestPool().query("insert into contact_visitor (visitor_id, contact_id) values ($1, $2)", [
      visitorId,
      contactId,
    ]);

    await GET(makeRequest("tiktok-main", `cb_visitor=${visitorId}`), {
      params: Promise.resolve({ slug: "tiktok-main" }),
    });

    const rows = await getTestPool().query("select contact_id from interaction where event_name = 'social_click'");
    expect(rows.rows[0].contact_id).toBe(contactId);
  });
});
