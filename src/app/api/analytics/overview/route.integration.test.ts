import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetActivityTables, closeTestPool, getTestPool, simulateVisit } from "@/server/db/testHelpers.integration";
import { GET } from "./route";

const TEST_TOKEN = "test-analytics-token-not-a-real-secret";

function makeRequest(authHeader?: string): NextRequest {
  return new NextRequest("https://cristianbarbosa.test/api/analytics/overview?range=30d", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("GET /api/analytics/overview", () => {
  const originalToken = process.env.ANALYTICS_API_TOKEN;

  beforeEach(resetActivityTables);
  afterEach(() => {
    process.env.ANALYTICS_API_TOKEN = originalToken;
  });
  afterAll(closeTestPool);

  it("fails closed (503) when ANALYTICS_API_TOKEN isn't configured — never open by default", async () => {
    delete process.env.ANALYTICS_API_TOKEN;
    const response = await GET(makeRequest(`Bearer ${TEST_TOKEN}`));
    expect(response.status).toBe(503);
  });

  it("rejects a request with no Authorization header", async () => {
    process.env.ANALYTICS_API_TOKEN = TEST_TOKEN;
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("rejects a request with the wrong token", async () => {
    process.env.ANALYTICS_API_TOKEN = TEST_TOKEN;
    const response = await GET(makeRequest("Bearer wrong-token"));
    expect(response.status).toBe(401);
  });

  it("succeeds with the correct bearer token and never leaks PII", async () => {
    process.env.ANALYTICS_API_TOKEN = TEST_TOKEN;

    const contactEmail = "should-never-appear@example.com";
    const client = await getTestPool().connect();
    try {
      await simulateVisit(client, { utmSource: "instagram" });
      await client.query(
        "insert into contact (email, first_name, last_name, phone) values ($1, 'Secret', 'Person', '+573000000000')",
        [contactEmail],
      );
    } finally {
      client.release();
    }

    const response = await GET(makeRequest(`Bearer ${TEST_TOKEN}`));
    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).not.toContain(contactEmail);
    expect(body).not.toContain("Secret");
    expect(body).not.toContain("+573000000000");

    const json = JSON.parse(body);
    expect(json.ok).toBe(true);
    expect(json.data).toHaveProperty("visitors");
    expect(json.data).toHaveProperty("ratios");
  });
});
