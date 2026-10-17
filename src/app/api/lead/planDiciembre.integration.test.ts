import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeTestPool, getTestPool, resetActivityTables } from "@/server/db/testHelpers.integration";
import { POST } from "./route";

function signUp(body: Record<string, unknown>): NextRequest {
  return new NextRequest("https://cristianbarbosa.test/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": randomUUID() },
    body: JSON.stringify({ consent: true, topic: "plan_diciembre", ...body }),
  });
}

describe("POST /api/lead — Plan Diciembre sign-up (topic plan_diciembre)", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("saves the lead AND a pending enrollment with the zone and goal from the form", async () => {
    const email = `pd-${randomUUID()}@example.com`;
    const response = await POST(
      signUp({ name: "Camila Ríos", email, phone: "3001234567", trainingZone: "Sabaneta", trainingGoal: "Mi primera dominada" }),
    );
    expect(response.status).toBe(200);

    const rows = await getTestPool().query(
      `select e.status, e.zone, e.goal, e.start_date, jsonb_array_length(e.base_routine) as days, p.slug,
              i.slug as interest, l.topic_raw
       from contact c
       join training_enrollment e on e.contact_id = c.id
       join product p on p.id = e.product_id
       join lead l on l.contact_id = c.id
       left join interest i on i.id = l.interest_id
       where c.email = $1`,
      [email],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({
      status: "pending",
      zone: "Sabaneta",
      goal: "Mi primera dominada",
      start_date: null,
      days: 3,
      slug: "plan-diciembre",
      interest: "coaching",
      topic_raw: "plan_diciembre",
    });
  });

  it("records the sign-up on its own landing route, not /contacto", async () => {
    const email = `pd-${randomUUID()}@example.com`;
    await POST(signUp({ name: "Camila Ríos", email, phone: "3001234568" }));
    const rows = await getTestPool().query(
      "select route from interaction i join contact c on c.id = i.contact_id where c.email = $1 and event_name = 'lead_submitted'",
      [email],
    );
    expect(rows.rows[0].route).toBe("/entrenar/plan-diciembre");
  });

  it("a regular topic never opens an enrollment", async () => {
    await POST(signUp({ topic: "coaching", name: "Otro", email: `c-${randomUUID()}@example.com`, phone: "3001234569" }));
    const rows = await getTestPool().query("select count(*) from training_enrollment");
    expect(Number(rows.rows[0].count)).toBe(0);
  });
});
