import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetActivityTables, closeTestPool, getTestPool } from "@/server/db/testHelpers.integration";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";
import { GET } from "./route";

const TEST_SESSION_SECRET = "session-test-secret-" + "x".repeat(20);

function makeRequest(sessionCookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (sessionCookie) headers.cookie = `${ADMIN_SESSION_COOKIE}=${sessionCookie}`;
  return new NextRequest("https://cristianbarbosa.test/api/admin/contacts", { headers });
}

describe("GET /api/admin/contacts", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  beforeEach(resetActivityTables);
  afterEach(() => {
    if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = originalSecret;
  });
  afterAll(closeTestPool);

  it("fails closed (503) when ADMIN_SESSION_SECRET isn't configured", async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    const response = await GET(makeRequest());
    expect(response.status).toBe(503);
  });

  it("rejects a request with no session cookie", async () => {
    process.env.ADMIN_SESSION_SECRET = TEST_SESSION_SECRET;
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns real contact PII to a logged-in admin — this endpoint's whole purpose, unlike /api/analytics/*", async () => {
    process.env.ADMIN_SESSION_SECRET = TEST_SESSION_SECRET;
    const token = createSessionToken(TEST_SESSION_SECRET);

    const email = `route-test-${Date.now()}@example.com`;
    const client = await getTestPool().connect();
    try {
      const contact = await client.query(
        `insert into contact (name, email, phone, first_touch_captured_at) values ('Carlos Ruiz', $1, '+573009998877', now()) returning id`,
        [email],
      );
      await client.query(`insert into lead (contact_id, topic_raw) values ($1, 'comunidad')`, [contact.rows[0].id]);
    } finally {
      client.release();
    }

    const response = await GET(makeRequest(token));
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.ok).toBe(true);
    const row = json.data.find((r: { contactEmail: string }) => r.contactEmail === email);
    expect(row).toBeDefined();
    expect(row.contactName).toBe("Carlos Ruiz");
    expect(row.contactPhone).toBe("+573009998877");
  });
});
