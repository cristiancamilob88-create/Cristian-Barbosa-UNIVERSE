import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "@/server/db/testHelpers.integration";
import { POST } from "./route";

// Each test gets its own synthetic IP so the module-level rate limiter
// (keyed by x-forwarded-for) never leaks state between tests.
function makeRequest(body: unknown, options: { cookie?: string; ip?: string } = {}): NextRequest {
  const ip = options.ip ?? randomUUID();
  return new NextRequest("https://cristianbarbosa.test/api/lead", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/lead", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("rejects invalid input with 400 and writes nothing", async () => {
    const response = await POST(makeRequest({ name: "A", email: "not-an-email", topic: "general" }));
    expect(response.status).toBe(400);

    const rows = await getTestPool().query("select count(*) from contact");
    expect(Number(rows.rows[0].count)).toBe(0);
  });

  it("silently drops a honeypot-tripped submission without writing anything", async () => {
    const response = await POST(
      makeRequest({
        name: "Bot",
        email: "bot@example.com",
        topic: "general",
        company: "not-empty",
      }),
    );
    expect(response.status).toBe(200);
    const rows = await getTestPool().query("select count(*) from lead");
    expect(Number(rows.rows[0].count)).toBe(0);
  });

  it("creates a contact, assigns the mapped interest, and creates a lead end to end", async () => {
    const email = `lead-${Date.now()}@example.com`;
    const cookie = "cb_visitor=11111111-1111-4111-8111-111111111111";

    const response = await POST(
      makeRequest({ name: "Ana Torres", email, topic: "entrenar", message: "Quiero info" }, { cookie }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const contactRows = await getTestPool().query("select id from contact where email = $1", [email]);
    expect(contactRows.rowCount).toBe(1);
    const contactId = contactRows.rows[0].id;

    const leadRows = await getTestPool().query(
      "select topic_raw, interest_id from lead where contact_id = $1",
      [contactId],
    );
    expect(leadRows.rowCount).toBe(1);
    expect(leadRows.rows[0].topic_raw).toBe("entrenar");
    expect(leadRows.rows[0].interest_id).not.toBeNull();

    const interactionRows = await getTestPool().query(
      "select event_name from interaction where contact_id = $1",
      [contactId],
    );
    expect(interactionRows.rows.map((r) => r.event_name)).toContain("lead_submitted");
  });

  it("routes a second submission with the same email to the same contact (no duplicate contact)", async () => {
    const email = `dup-${Date.now()}@example.com`;

    await POST(makeRequest({ name: "Ana", email, topic: "musica" }));
    await POST(makeRequest({ name: "Ana", email, topic: "shows" }));

    const contactRows = await getTestPool().query("select id from contact where email = $1", [email]);
    expect(contactRows.rowCount).toBe(1);

    const leadRows = await getTestPool().query("select count(*) from lead where contact_id = $1", [
      contactRows.rows[0].id,
    ]);
    expect(Number(leadRows.rows[0].count)).toBe(2);
  });

  it("stores a name containing SQL metacharacters as inert data", async () => {
    const email = `injection-${Date.now()}@example.com`;
    const maliciousName = "Robert'); DROP TABLE contact; --";

    const response = await POST(makeRequest({ name: maliciousName, email, topic: "general" }));
    expect(response.status).toBe(200);

    const rows = await getTestPool().query("select name from contact where email = $1", [email]);
    expect(rows.rows[0].name).toBe(maliciousName);

    await expect(getTestPool().query("select count(*) from contact")).resolves.toBeDefined();
  });

  it("rate-limits a burst of requests from the same IP", async () => {
    const ip = randomUUID();
    const responses = [];
    for (let i = 0; i < 6; i++) {
      responses.push(
        await POST(makeRequest({ name: "Ana", email: `burst-${i}-${Date.now()}@example.com`, topic: "general" }, { ip })),
      );
    }
    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });
});
