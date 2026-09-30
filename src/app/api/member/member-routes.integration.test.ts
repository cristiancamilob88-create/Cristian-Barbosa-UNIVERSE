import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeTestPool, getTestPool, resetActivityTables } from "@/server/db/testHelpers.integration";
import { TEST_MEMBER_SECRET, makeStudent, uniqueEmail } from "@/server/db/trainingTestHelpers.integration";
import { issueLoginCode } from "@/server/db/repositories/memberLoginCode";
import { getTrainingLogs } from "@/server/db/repositories/training";
import { MEMBER_SESSION_COOKIE, createMemberSessionToken, readMemberSessionToken } from "@/server/auth/memberSession";
import { POST as requestCode } from "./login/request/route";
import { POST as verifyCode } from "./login/verify/route";
import { POST as saveLog } from "./log/route";

function post(path: string, body: unknown, cookie?: string): NextRequest {
  return new NextRequest(`https://cristianbarbosa.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": randomUUID(),
      ...(cookie ? { cookie: `${MEMBER_SESSION_COOKIE}=${cookie}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

const original = {
  MEMBER_SESSION_SECRET: process.env.MEMBER_SESSION_SECRET,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
};

beforeEach(async () => {
  await resetActivityTables();
  process.env.MEMBER_SESSION_SECRET = TEST_MEMBER_SECRET;
  // No real email in tests: Gmail stays unconfigured.
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

describe("POST /api/member/login/request", () => {
  it("fails closed (503) when MEMBER_SESSION_SECRET isn't configured", async () => {
    delete process.env.MEMBER_SESSION_SECRET;
    const res = await requestCode(post("/api/member/login/request", { email: uniqueEmail() }));
    expect(res.status).toBe(503);
  });

  it("answers an unknown email exactly like a real send — no way to probe who's a student", async () => {
    const res = await requestCode(post("/api/member/login/request", { email: uniqueEmail() }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it("tells an approved student plainly when the email couldn't go out (instead of a code that never arrives)", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const res = await requestCode(post("/api/member/login/request", { email: student.email }));
    expect(res.status).toBe(502);
  });

  it("rejects a malformed email", async () => {
    const res = await requestCode(post("/api/member/login/request", { email: "not-an-email" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/member/login/verify", () => {
  it("sets a session cookie for the right contact on a correct code", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const client = await getTestPool().connect();
    let code: string;
    try {
      const issued = await issueLoginCode(client, student.email, TEST_MEMBER_SECRET);
      if (issued.status !== "issued") throw new Error("expected issued");
      code = issued.code;
    } finally {
      client.release();
    }

    const res = await verifyCode(post("/api/member/login/verify", { email: student.email, code }));
    expect(res.status).toBe(200);
    const token = res.cookies.get(MEMBER_SESSION_COOKIE)?.value;
    expect(readMemberSessionToken(token, TEST_MEMBER_SECRET)).toBe(student.contactId);
  });

  it("rejects a wrong code without setting a cookie", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const res = await verifyCode(post("/api/member/login/verify", { email: student.email, code: "123456" }));
    expect(res.status).toBe(400);
    expect(res.cookies.get(MEMBER_SESSION_COOKIE)).toBeUndefined();
  });

  it("asks for consent (needsConsent) for a hand-added student", async () => {
    const student = await makeStudent({ startDate: "2026-10-05", consent: false });
    const client = await getTestPool().connect();
    let code: string;
    try {
      const issued = await issueLoginCode(client, student.email, TEST_MEMBER_SECRET);
      if (issued.status !== "issued") throw new Error("expected issued");
      code = issued.code;
    } finally {
      client.release();
    }
    const res = await verifyCode(post("/api/member/login/verify", { email: student.email, code }));
    expect(res.status).toBe(400);
    expect((await res.json()).needsConsent).toBe(true);
  });
});

describe("POST /api/member/log", () => {
  it("rejects a request with no session", async () => {
    const res = await saveLog(post("/api/member/log", { week: 1, dayIndex: 0, done: [true] }));
    expect(res.status).toBe(401);
  });

  it("rejects a forged session cookie", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const forged = createMemberSessionToken(student.contactId, "some-other-secret-" + "z".repeat(20));
    const res = await saveLog(post("/api/member/log", { week: 1, dayIndex: 0, done: [true] }, forged));
    expect(res.status).toBe(401);
  });

  it("saves to the signed-in student's own plan", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const token = createMemberSessionToken(student.contactId, TEST_MEMBER_SECRET);

    const res = await saveLog(post("/api/member/log", { week: 2, dayIndex: 1, done: [true, true, false, false] }, token));
    expect(res.status).toBe(200);
    const logs = await getTrainingLogs(getTestPool(), student.enrollment.id);
    expect(logs[2][1].done).toEqual([true, true, false, false]);
  });

  it("refuses a signed-in contact whose sign-up was never approved", async () => {
    const pending = await makeStudent();
    const token = createMemberSessionToken(pending.contactId, TEST_MEMBER_SECRET);
    const res = await saveLog(post("/api/member/log", { week: 1, dayIndex: 0, done: [true] }, token));
    expect(res.status).toBe(403);
  });

  it("rejects a day, week or checkbox count that isn't in the student's routine", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const token = createMemberSessionToken(student.contactId, TEST_MEMBER_SECRET);

    expect((await saveLog(post("/api/member/log", { week: 1, dayIndex: 7, done: [true] }, token))).status).toBe(400);
    expect((await saveLog(post("/api/member/log", { week: 13, dayIndex: 0, done: [true] }, token))).status).toBe(400);
    const tooMany = Array(9).fill(true);
    expect((await saveLog(post("/api/member/log", { week: 1, dayIndex: 0, done: tooMany }, token))).status).toBe(400);
  });
});

describe("POST /api/member/log — results", () => {
  it("saves what the student did per exercise, and refuses more results than exercises", async () => {
    const student = await makeStudent({ startDate: "2026-10-05" });
    const token = createMemberSessionToken(student.contactId, TEST_MEMBER_SECRET);

    const ok = await saveLog(post("/api/member/log", { week: 1, dayIndex: 2, results: ["22", "10 c/pierna", ""] }, token));
    expect(ok.status).toBe(200);
    const logs = await getTrainingLogs(getTestPool(), student.enrollment.id);
    expect(logs[1][2].results).toEqual(["22", "10 c/pierna", ""]);

    const tooMany = await saveLog(post("/api/member/log", { week: 1, dayIndex: 2, results: ["1", "2", "3", "4"] }, token));
    expect(tooMany.status).toBe(400);
  });
});
