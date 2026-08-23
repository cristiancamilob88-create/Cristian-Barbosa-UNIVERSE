import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetActivityTables, closeTestPool, getTestPool, simulateVisit } from "@/server/db/testHelpers.integration";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";
import { GET } from "./route";

const TEST_TOKEN = "test-analytics-token-not-a-real-secret";
const TEST_SESSION_SECRET = "session-test-secret-" + "x".repeat(20);

function makeRequest(authHeader?: string, sessionCookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers.authorization = authHeader;
  if (sessionCookie) headers.cookie = `${ADMIN_SESSION_COOKIE}=${sessionCookie}`;
  return new NextRequest("https://cristianbarbosa.test/api/analytics/overview?range=30d", { headers });
}

describe("GET /api/analytics/overview", () => {
  const originalToken = process.env.ANALYTICS_API_TOKEN;
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  beforeEach(resetActivityTables);
  afterEach(() => {
    // Assigning `undefined` to a process.env key stringifies it to
    // "undefined" instead of deleting it — that stray 9/9-char string
    // then fails ANALYTICS_API_TOKEN's/ADMIN_SESSION_SECRET's own
    // min-length validation in getServerEnv() on the next test. Restore
    // properly: delete when there was nothing there to begin with.
    if (originalToken === undefined) delete process.env.ANALYTICS_API_TOKEN;
    else process.env.ANALYTICS_API_TOKEN = originalToken;
    if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = originalSecret;
  });
  afterAll(closeTestPool);

  it("accepts the Command Center's own admin session cookie — no bearer token involved (Block 04)", async () => {
    delete process.env.ANALYTICS_API_TOKEN;
    process.env.ADMIN_SESSION_SECRET = TEST_SESSION_SECRET;
    const token = createSessionToken(TEST_SESSION_SECRET);

    const response = await GET(makeRequest(undefined, token));
    expect(response.status).toBe(200);
  });

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
