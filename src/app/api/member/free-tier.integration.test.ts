import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeTestPool, getTestPool, resetActivityTables } from "@/server/db/testHelpers.integration";
import { TEST_MEMBER_SECRET, makeStudent, uniqueEmail } from "@/server/db/trainingTestHelpers.integration";
import { MEMBER_SESSION_COOKIE, createMemberSessionToken } from "@/server/auth/memberSession";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";
import { ensureFreeEnrollment, getMemberEnrollment, getTrainingLogs, listMeasurements } from "@/server/db/repositories/training";
import { hasEntitlement } from "@/server/db/repositories/entitlement";
import { POST as signup } from "./signup/route";
import { POST as saveLog } from "./log/route";
import { DELETE as deleteMeasurement, POST as addMeasurement } from "./measurements/route";
import { GET as roster } from "../admin/training/enrollments/route";

const ADMIN_SECRET = "admin-test-secret-" + "f".repeat(20);

function post(path: string, body: unknown, cookie?: string): NextRequest {
  return new NextRequest(`https://cristianbarbosa.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": randomUUID(),
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

const original = {
  MEMBER_SESSION_SECRET: process.env.MEMBER_SESSION_SECRET,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
};

beforeEach(async () => {
  await resetActivityTables();
  process.env.MEMBER_SESSION_SECRET = TEST_MEMBER_SECRET;
  process.env.ADMIN_SESSION_SECRET = ADMIN_SECRET;
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;
});
afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
afterAll(closeTestPool);

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

describe("POST /api/member/signup — free tier", () => {
  it("creates the contact with consent, a lead, and an ACTIVE free enrollment starting today", async () => {
    const email = uniqueEmail("gratis");
    const res = await signup(post("/api/member/signup", { name: "Valentina", email, objective: "tonificar", consent: true }));
    // Gmail isn't configured in tests, so the code can't go out — but the account exists.
    expect(res.status).toBe(502);

    const rows = await getTestPool().query(
      `select c.id as contact_id, c.data_consent_at, e.status, e.start_date::text as start_date, e.objective, p.slug,
              l.topic_raw
       from contact c
       join training_enrollment e on e.contact_id = c.id
       join product p on p.id = e.product_id
       join lead l on l.contact_id = c.id
       where c.email = $1`,
      [email],
    );
    expect(rows.rows).toHaveLength(1);
    const row = rows.rows[0];
    expect(row).toMatchObject({ status: "active", objective: "tonificar", slug: "rutinas-gratis", topic_raw: "app_gratis" });
    expect(row.start_date).toBe(today());
    expect(row.data_consent_at).not.toBeNull();

    const enrollment = await getMemberEnrollment(getTestPool(), row.contact_id);
    expect(enrollment?.baseRoutine.length).toBeGreaterThan(0);
    expect(await hasEntitlement(getTestPool(), row.contact_id, enrollment!.productId)).toBe(true);
  });

  it("requires consent and a valid objective", async () => {
    const noConsent = await signup(post("/api/member/signup", { name: "Valentina", email: uniqueEmail(), objective: "fuerza", consent: false }));
    expect(noConsent.status).toBe(400);
    const badObjective = await signup(post("/api/member/signup", { name: "Valentina", email: uniqueEmail(), objective: "volar", consent: true }));
    expect(badObjective.status).toBe(400);
  });

  it("drops a honeypot-tripped sign-up silently", async () => {
    const email = uniqueEmail("bot");
    const res = await signup(post("/api/member/signup", { name: "Bot", email, objective: "fuerza", consent: true, company: "x" }));
    expect(res.status).toBe(200);
    const rows = await getTestPool().query("select count(*) from contact where email = $1", [email]);
    expect(Number(rows.rows[0].count)).toBe(0);
  });
});

describe("free + paid", () => {
  it("signing up twice keeps one free enrollment", async () => {
    const student = await makeStudent();
    const client = await getTestPool().connect();
    try {
      const a = await ensureFreeEnrollment(client, { contactId: student.contactId, objective: "fuerza", startDate: "2026-10-07" });
      const b = await ensureFreeEnrollment(client, { contactId: student.contactId, objective: "fuerza", startDate: "2026-10-08" });
      expect(a?.id).toBe(b?.id);
      expect(b?.startDate).toBe("2026-10-07");
    } finally {
      client.release();
    }
  });

  it("a paying student who also has the free tier sees their paid plan", async () => {
    const student = await makeStudent({ startDate: "2026-09-01" });
    const client = await getTestPool().connect();
    try {
      await ensureFreeEnrollment(client, { contactId: student.contactId, objective: null, startDate: "2026-10-07" });
    } finally {
      client.release();
    }
    expect((await getMemberEnrollment(getTestPool(), student.contactId))?.id).toBe(student.enrollment.id);
  });

  it("the admin roster leaves free users out and counts them", async () => {
    await makeStudent({ name: "Alumna Paga", startDate: "2026-09-01" });
    const free = await makeStudent({ name: "Usuario Gratis" });
    const client = await getTestPool().connect();
    try {
      await ensureFreeEnrollment(client, { contactId: free.contactId, objective: null, startDate: "2026-10-07" });
    } finally {
      client.release();
    }
    const res = await roster(
      new NextRequest("https://cristianbarbosa.test/api/admin/training/enrollments", {
        headers: { cookie: `${ADMIN_SESSION_COOKIE}=${createSessionToken(ADMIN_SECRET)}` },
      }),
    );
    const body = await res.json();
    expect(body.freeUsers).toBe(1);
    // makeStudent() always opens a Plan Diciembre enrollment — the free user's pending one still shows; their free one doesn't.
    expect(body.data.filter((r: { programName: string }) => r.programName.startsWith("Rutinas gratis"))).toHaveLength(0);
  });
});

describe("progress: timer and max tests", () => {
  it("saves how long a day's workout took", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const cookie = `${MEMBER_SESSION_COOKIE}=${createMemberSessionToken(student.contactId, TEST_MEMBER_SECRET)}`;
    const res = await saveLog(post("/api/member/log", { week: 1, dayIndex: 0, durationSeconds: 1930 }, cookie));
    expect(res.status).toBe(200);
    expect((await getTrainingLogs(getTestPool(), student.enrollment.id))[1][0].durationSeconds).toBe(1930);

    const tooLong = await saveLog(post("/api/member/log", { week: 1, dayIndex: 0, durationSeconds: 99999 }, cookie));
    expect(tooLong.status).toBe(400);
  });

  it("a student logs and deletes their own max tests — and can't delete someone else's", async () => {
    const a = await makeStudent({ startDate: "2026-10-05" });
    const b = await makeStudent({ startDate: "2026-10-05" });
    const cookieA = `${MEMBER_SESSION_COOKIE}=${createMemberSessionToken(a.contactId, TEST_MEMBER_SECRET)}`;
    const cookieB = `${MEMBER_SESSION_COOKIE}=${createMemberSessionToken(b.contactId, TEST_MEMBER_SECRET)}`;

    const saved = await (
      await addMeasurement(post("/api/member/measurements", { measuredOn: "2026-10-07", pushUps: 18, plankSeconds: 45 }, cookieA))
    ).json();
    expect(saved.data).toMatchObject({ pushUps: 18, plankSeconds: 45, pullUps: null });

    const empty = await addMeasurement(post("/api/member/measurements", { measuredOn: "2026-10-07" }, cookieA));
    expect(empty.status).toBe(400);

    const del = (cookie: string) =>
      deleteMeasurement(
        new NextRequest(`https://cristianbarbosa.test/api/member/measurements?id=${saved.data.id}`, {
          method: "DELETE",
          headers: { cookie, "x-forwarded-for": randomUUID() },
        }),
      );
    expect((await del(cookieB)).status).toBe(404);
    expect(await listMeasurements(getTestPool(), a.enrollment.id)).toHaveLength(1);
    expect((await del(cookieA)).status).toBe(200);
    expect(await listMeasurements(getTestPool(), a.enrollment.id)).toHaveLength(0);
  });
});
