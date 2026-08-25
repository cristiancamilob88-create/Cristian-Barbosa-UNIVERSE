import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "@/server/db/testHelpers.integration";
import { POST } from "./route";

// Each test gets its own synthetic IP so the module-level rate limiter
// (keyed by x-forwarded-for) never leaks state between tests — same
// convention as /api/lead's own test file.
function makeRequest(body: unknown, options: { cookie?: string; ip?: string } = {}): NextRequest {
  const ip = options.ip ?? randomUUID();
  return new NextRequest("https://cristianbarbosa.test/api/track", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/track", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("rejects an event name outside the taxonomy", async () => {
    const response = await POST(makeRequest({ eventName: "made_up_event" }));
    expect(response.status).toBe(400);
  });

  it("records a cta_click interaction and mints a visitor cookie when none was sent", async () => {
    const response = await POST(
      makeRequest({ eventName: "cta_click", route: "/shows", metadata: { cta: "solicitar_info", topic: "shows" } }),
    );
    expect(response.status).toBe(200);
    expect(response.cookies.get("cb_visitor")).toBeDefined();

    const rows = await getTestPool().query(
      "select event_name, route, metadata from interaction where event_name = 'cta_click'",
    );
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].route).toBe("/shows");
    expect(rows.rows[0].metadata).toEqual({ cta: "solicitar_info", topic: "shows" });
  });

  it("reuses an existing cb_visitor cookie instead of minting a new one", async () => {
    const cookie = "cb_visitor=22222222-2222-4222-8222-222222222222";
    const response = await POST(makeRequest({ eventName: "interest_selected" }, { cookie }));
    expect(response.status).toBe(200);
    expect(response.cookies.get("cb_visitor")).toBeUndefined();

    const rows = await getTestPool().query(
      "select visitor_id from interaction where event_name = 'interest_selected'",
    );
    expect(rows.rows[0].visitor_id).toBe("22222222-2222-4222-8222-222222222222");
  });

  it("rate-limits a flood of events from the same IP", async () => {
    const ip = randomUUID();
    const responses = [];
    for (let i = 0; i < 61; i++) {
      responses.push(await POST(makeRequest({ eventName: "page_view", route: "/" }, { ip })));
    }
    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });
});
