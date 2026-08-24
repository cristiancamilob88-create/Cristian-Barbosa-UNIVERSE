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

  it("maps productos_fisicos/productos_digitales to their own interests, not the old generic one (Block 07)", async () => {
    const physicalEmail = `fisicos-${Date.now()}@example.com`;
    const digitalEmail = `digitales-${Date.now()}@example.com`;

    await POST(makeRequest({ name: "Fisicos Lead", email: physicalEmail, topic: "productos_fisicos" }));
    await POST(makeRequest({ name: "Digitales Lead", email: digitalEmail, topic: "productos_digitales" }));

    const physicalRows = await getTestPool().query(
      `select i.slug from lead l join interest i on i.id = l.interest_id
       join contact c on c.id = l.contact_id where c.email = $1`,
      [physicalEmail],
    );
    expect(physicalRows.rows[0].slug).toBe("physical_products");

    const digitalRows = await getTestPool().query(
      `select i.slug from lead l join interest i on i.id = l.interest_id
       join contact c on c.id = l.contact_id where c.email = $1`,
      [digitalEmail],
    );
    expect(digitalRows.rows[0].slug).toBe("digital_products");
  });

  it("rejects the retired bare 'productos' topic", async () => {
    const response = await POST(
      makeRequest({ name: "Old Topic", email: `old-topic-${Date.now()}@example.com`, topic: "productos" }),
    );
    expect(response.status).toBe(400);
  });

  it("opens a b2b_opportunity for a shows/marcas topic, but not for others (Block 07)", async () => {
    const showsEmail = `shows-${Date.now()}@example.com`;
    const marcasEmail = `marcas-${Date.now()}@example.com`;
    const trainingEmail = `entrenar-${Date.now()}@example.com`;

    await POST(makeRequest({ name: "Show Lead", email: showsEmail, topic: "shows", message: "Un evento" }));
    await POST(makeRequest({ name: "Marca Lead", email: marcasEmail, topic: "marcas" }));
    await POST(makeRequest({ name: "Training Lead", email: trainingEmail, topic: "entrenar" }));

    const showsContact = await getTestPool().query("select id from contact where email = $1", [showsEmail]);
    const showsOpps = await getTestPool().query(
      "select category, stage, notes from b2b_opportunity where contact_id = $1",
      [showsContact.rows[0].id],
    );
    expect(showsOpps.rowCount).toBe(1);
    expect(showsOpps.rows[0].category).toBe("shows");
    expect(showsOpps.rows[0].stage).toBe("lead");
    expect(showsOpps.rows[0].notes).toBe("Un evento");

    const marcasContact = await getTestPool().query("select id from contact where email = $1", [marcasEmail]);
    const marcasOpps = await getTestPool().query("select category from b2b_opportunity where contact_id = $1", [
      marcasContact.rows[0].id,
    ]);
    expect(marcasOpps.rowCount).toBe(1);
    expect(marcasOpps.rows[0].category).toBe("brands");

    const trainingContact = await getTestPool().query("select id from contact where email = $1", [trainingEmail]);
    const trainingOpps = await getTestPool().query("select count(*) from b2b_opportunity where contact_id = $1", [
      trainingContact.rows[0].id,
    ]);
    expect(Number(trainingOpps.rows[0].count)).toBe(0);
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
