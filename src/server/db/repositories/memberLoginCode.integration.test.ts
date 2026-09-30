import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeTestPool, getTestPool, resetActivityTables } from "@/server/db/testHelpers.integration";
import { TEST_MEMBER_SECRET, makeStudent, uniqueEmail } from "@/server/db/trainingTestHelpers.integration";
import { issueLoginCode, verifyLoginCode } from "./memberLoginCode";

async function withClient<T>(fn: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  const client = await getTestPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

const issue = (email: string, now?: Date) => withClient((c) => issueLoginCode(c, email, TEST_MEMBER_SECRET, now));
const verify = (email: string, code: string, opts: { consent?: boolean; now?: Date } = {}) =>
  withClient((c) =>
    verifyLoginCode(c, { email, code, consent: opts.consent ?? false, consentVersion: "test-v1" }, TEST_MEMBER_SECRET, opts.now),
  );

function wrong(code: string): string {
  return code === "000000" ? "111111" : "000000";
}

describe("member login codes", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("only an approved student gets a code — not an unknown email, not a pending sign-up", async () => {
    expect((await issue(uniqueEmail())).status).toBe("not_eligible");
    const pending = await makeStudent();
    expect((await issue(pending.email)).status).toBe("not_eligible");

    const active = await makeStudent({ startDate: "2026-10-05" });
    const result = await issue(active.email);
    expect(result.status).toBe("issued");
    if (result.status === "issued") expect(result.code).toMatch(/^\d{6}$/);
  });

  it("matches the email case-insensitively", async () => {
    const active = await makeStudent({ startDate: "2026-10-05" });
    expect((await issue(active.email.toUpperCase())).status).toBe("issued");
  });

  it("never stores the code itself", async () => {
    const active = await makeStudent({ startDate: "2026-10-05" });
    const result = await issue(active.email);
    if (result.status !== "issued") throw new Error("expected issued");
    const rows = await getTestPool().query("select code_hash from member_login_code where contact_id = $1", [active.contactId]);
    expect(rows.rows[0].code_hash).not.toContain(result.code);
    expect(rows.rows[0].code_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("won't issue a second code within the cooldown", async () => {
    const active = await makeStudent({ startDate: "2026-10-05" });
    const t0 = new Date();
    expect((await issue(active.email, t0)).status).toBe("issued");
    expect((await issue(active.email, new Date(t0.getTime() + 30_000))).status).toBe("cooldown");
    expect((await issue(active.email, new Date(t0.getTime() + 61_000))).status).toBe("issued");
  });

  it("a correct code signs in once; the same code can't be reused", async () => {
    const active = await makeStudent({ startDate: "2026-10-05" });
    const result = await issue(active.email);
    if (result.status !== "issued") throw new Error("expected issued");

    expect(await verify(active.email, result.code)).toEqual({ status: "ok", contactId: active.contactId });
    expect((await verify(active.email, result.code)).status).toBe("invalid");
  });

  it("an expired code is rejected", async () => {
    const active = await makeStudent({ startDate: "2026-10-05" });
    const t0 = new Date();
    const result = await issue(active.email, t0);
    if (result.status !== "issued") throw new Error("expected issued");
    const later = new Date(t0.getTime() + 11 * 60_000);
    expect((await verify(active.email, result.code, { now: later })).status).toBe("invalid");
  });

  it("locks the code after 5 wrong guesses — even the right code stops working", async () => {
    const active = await makeStudent({ startDate: "2026-10-05" });
    const result = await issue(active.email);
    if (result.status !== "issued") throw new Error("expected issued");

    for (let i = 0; i < 4; i++) expect((await verify(active.email, wrong(result.code))).status).toBe("invalid");
    expect((await verify(active.email, wrong(result.code))).status).toBe("locked");
    expect((await verify(active.email, result.code)).status).toBe("locked");
  });

  it("a student without recorded consent must authorize it first — without burning the code", async () => {
    const handAdded = await makeStudent({ startDate: "2026-10-05", consent: false });
    const result = await issue(handAdded.email);
    if (result.status !== "issued") throw new Error("expected issued");

    expect((await verify(handAdded.email, result.code)).status).toBe("needs_consent");
    expect((await verify(handAdded.email, result.code, { consent: true })).status).toBe("ok");

    const contact = await getTestPool().query("select data_consent_at, data_consent_version from contact where id = $1", [
      handAdded.contactId,
    ]);
    expect(contact.rows[0].data_consent_at).not.toBeNull();
    expect(contact.rows[0].data_consent_version).toBe("test-v1");
  });

  it("a code issued to one student doesn't work for another", async () => {
    const a = await makeStudent({ startDate: "2026-10-05" });
    const b = await makeStudent({ startDate: "2026-10-05" });
    const result = await issue(a.email);
    if (result.status !== "issued") throw new Error("expected issued");
    expect((await verify(b.email, result.code)).status).toBe("invalid");
  });
});
