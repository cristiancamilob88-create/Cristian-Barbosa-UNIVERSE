import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeTestPool, getTestPool, resetActivityTables } from "@/server/db/testHelpers.integration";
import { makeStudent, uniqueEmail } from "@/server/db/trainingTestHelpers.integration";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";
import { saveDayLog } from "@/server/db/repositories/training";
import { hasEntitlement } from "@/server/db/repositories/entitlement";
import { GET as getRoster, POST as createStudent } from "./enrollments/route";
import { POST as activate } from "./enrollments/[id]/activate/route";
import { GET as getStudent, PATCH as patchStudent } from "./enrollments/[id]/route";
import { PUT as putRoutine } from "./enrollments/[id]/routine/route";

const ADMIN_SECRET = "admin-test-secret-" + "a".repeat(20);

function request(path: string, init: { method?: string; body?: unknown; admin?: boolean } = {}): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.admin !== false) headers.cookie = `${ADMIN_SESSION_COOKIE}=${createSessionToken(ADMIN_SECRET)}`;
  return new NextRequest(`https://cristianbarbosa.test${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

const activateCtx = (id: string) => ({ params: Promise.resolve({ id }) });

const original = {
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  GMAIL_USER: process.env.GMAIL_USER,
};

beforeEach(async () => {
  await resetActivityTables();
  process.env.ADMIN_SESSION_SECRET = ADMIN_SECRET;
  delete process.env.GMAIL_USER;
});
afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
afterAll(closeTestPool);

describe("/api/admin/training/*", () => {
  it("requires the admin session on every endpoint", async () => {
    expect((await getRoster(request("/api/admin/training/enrollments", { admin: false }))).status).toBe(401);
    expect(
      (await createStudent(request("/api/admin/training/enrollments", { method: "POST", admin: false, body: {} }))).status,
    ).toBe(401);
    const res = await activate(
      request("/api/admin/training/enrollments/x/activate", { method: "POST", admin: false, body: {} }),
      activateCtx("00000000-0000-0000-0000-000000000000"),
    );
    expect(res.status).toBe(401);
  });

  it("adds a student by hand as pending when no start date is given", async () => {
    const email = uniqueEmail("manual");
    const res = await createStudent(
      request("/api/admin/training/enrollments", {
        method: "POST",
        body: { name: "Luis Gómez", email, phone: "300 111 2233", level: "principiante", zone: "Envigado" },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.status).toBe("pending");
  });

  it("adds a student by hand AND approves them when a start date is given", async () => {
    const email = uniqueEmail("manual");
    const res = await createStudent(
      request("/api/admin/training/enrollments", {
        method: "POST",
        body: { name: "Luis Gómez", email, startDate: "2026-10-06" },
      }),
    );
    const json = await res.json();
    expect(json.data.status).toBe("active");

    const row = await getTestPool().query(
      "select e.contact_id, e.product_id from training_enrollment e where e.id = $1",
      [json.data.enrollmentId],
    );
    expect(await hasEntitlement(getTestPool(), row.rows[0].contact_id, row.rows[0].product_id)).toBe(true);
  });

  it("approves a pending sign-up: active from the chosen date, with access", async () => {
    const student = await makeStudent();
    const res = await activate(
      request(`/api/admin/training/enrollments/${student.enrollment.id}/activate`, {
        method: "POST",
        body: { startDate: "2026-10-12" },
      }),
      activateCtx(student.enrollment.id),
    );
    expect(res.status).toBe(200);
    expect(await hasEntitlement(getTestPool(), student.contactId, student.enrollment.productId)).toBe(true);
  });

  it("404s an unknown enrollment id", async () => {
    const id = "00000000-0000-0000-0000-000000000000";
    const res = await activate(
      request(`/api/admin/training/enrollments/${id}/activate`, { method: "POST", body: { startDate: "2026-10-12" } }),
      activateCtx(id),
    );
    expect(res.status).toBe(404);
  });

  it("the roster lists pending sign-ups first and computes this week's standing like the student sees it", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const active = await makeStudent({ name: "Activa Uno", startDate: today });
    await makeStudent({ name: "Pendiente Dos" });
    // 4 of the 11 beginner exercises done this week, plus a note.
    await saveDayLog(getTestPool(), { enrollmentId: active.enrollment.id, week: 1, dayIndex: 0, done: [true, true, true, true] });
    await saveDayLog(getTestPool(), { enrollmentId: active.enrollment.id, week: 1, dayIndex: 1, note: "Muy duro" });

    const res = await getRoster(request("/api/admin/training/enrollments"));
    const { data } = await res.json();
    expect(data[0].contactName).toBe("Pendiente Dos");
    expect(data[0].currentWeek).toBeNull();

    const row = data.find((r: { contactName: string }) => r.contactName === "Activa Uno");
    expect(row.currentWeek).toBe(1);
    expect(row.weekPercent).toBe(36);
    expect(row.standingLabel).toBe("Se está quedando");
    expect(row.lastNote).toBe("Muy duro");
  });
});

describe("/api/admin/training/enrollments/[id] — student page", () => {
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  it("requires the admin session", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const res = await getStudent(request(`/api/admin/training/enrollments/${student.enrollment.id}`, { admin: false }), ctx(student.enrollment.id));
    expect(res.status).toBe(401);
    const put = await putRoutine(
      request(`/api/admin/training/enrollments/${student.enrollment.id}/routine`, { method: "PUT", admin: false, body: {} }),
      ctx(student.enrollment.id),
    );
    expect(put.status).toBe(401);
  });

  it("returns the requested week with the student's logs and results", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    await saveDayLog(getTestPool(), {
      enrollmentId: student.enrollment.id,
      week: 2,
      dayIndex: 1,
      done: [true],
      results: ["12, 10, 9"],
      note: "Bien",
    });
    const res = await getStudent(
      request(`/api/admin/training/enrollments/${student.enrollment.id}?semana=2`),
      ctx(student.enrollment.id),
    );
    const { data } = await res.json();
    expect(data.week).toBe(2);
    expect(data.hasOwnRoutine).toBe(false);
    expect(data.logs[1]).toEqual({ done: [true], results: ["12, 10, 9"], note: "Bien", durationSeconds: null });
    expect(data.contact.name).toBe("Ana Pérez");
  });

  it("saves a routine for one week and the student page then shows it as its own", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const id = student.enrollment.id;
    const days = [{ title: "Espalda", kind: "Clase", exercises: [{ name: "Dominadas", dose: "4 × 5", cue: "Pecho arriba" }] }];
    const put = await putRoutine(
      request(`/api/admin/training/enrollments/${id}/routine`, { method: "PUT", body: { week: 3, days, mode: "week" } }),
      ctx(id),
    );
    expect(put.status).toBe(200);

    const { data } = await (await getStudent(request(`/api/admin/training/enrollments/${id}?semana=3`), ctx(id))).json();
    expect(data.hasOwnRoutine).toBe(true);
    expect(data.routine[0].exercises[0].name).toBe("Dominadas");
  });

  it("rejects an empty or malformed routine, and a week beyond the plan", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const id = student.enrollment.id;
    const bad = await putRoutine(
      request(`/api/admin/training/enrollments/${id}/routine`, { method: "PUT", body: { week: 1, days: [], mode: "week" } }),
      ctx(id),
    );
    expect(bad.status).toBe(400);
    const days = [{ title: "X", exercises: [{ name: "Y" }] }];
    const tooFar = await putRoutine(
      request(`/api/admin/training/enrollments/${id}/routine`, { method: "PUT", body: { week: 13, days, mode: "week" } }),
      ctx(id),
    );
    expect(tooFar.status).toBe(400);
  });

  it("updates objective and profile", async () => {
    const student = await makeStudent();
    const id = student.enrollment.id;
    const res = await patchStudent(
      request(`/api/admin/training/enrollments/${id}`, {
        method: "PATCH",
        body: { objective: "fuerza", goal: "Muscle up", level: "avanzado", zone: "Envigado" },
      }),
      ctx(id),
    );
    expect(res.status).toBe(200);
    const row = await getTestPool().query("select objective, level from training_enrollment where id = $1", [id]);
    expect(row.rows[0]).toEqual({ objective: "fuerza", level: "avanzado" });
  });
});
