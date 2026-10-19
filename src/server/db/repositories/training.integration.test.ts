import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeTestPool, getTestPool, resetActivityTables } from "@/server/db/testHelpers.integration";
import { makeStudent } from "@/server/db/trainingTestHelpers.integration";
import { hasEntitlement } from "./entitlement";
import {
  activateEnrollment,
  getMemberEnrollment,
  getTrainingLogs,
  saveDayLog,
  upsertPendingEnrollment,
} from "./training";

describe("training repository (Plan Diciembre)", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("a new sign-up is pending, with the beginner template copied in as its base routine", async () => {
    const { enrollment } = await makeStudent();
    expect(enrollment.status).toBe("pending");
    expect(enrollment.startDate).toBeNull();
    expect(enrollment.weeks).toBe(12);
    expect(enrollment.baseRoutine.length).toBe(3);
    expect(enrollment.baseRoutine[0].exercises[0].name).toBe("Flexiones inclinadas");
  });

  it("a pending student has no access — getMemberEnrollment is null until approved", async () => {
    const { contactId, enrollment } = await makeStudent();
    expect(await getMemberEnrollment(getTestPool(), contactId)).toBeNull();
    expect(await hasEntitlement(getTestPool(), contactId, enrollment.productId)).toBe(false);
  });

  it("approval activates the enrollment from its start date AND grants the product's entitlement", async () => {
    const { contactId, enrollment } = await makeStudent({ startDate: "2026-10-05" });
    expect(enrollment.status).toBe("active");
    expect(enrollment.startDate).toBe("2026-10-05");
    expect(await hasEntitlement(getTestPool(), contactId, enrollment.productId)).toBe(true);

    const member = await getMemberEnrollment(getTestPool(), contactId);
    expect(member?.id).toBe(enrollment.id);
  });

  it("start_date round-trips as the exact calendar date, whatever the server timezone", async () => {
    const { contactId } = await makeStudent({ startDate: "2026-12-31" });
    expect((await getMemberEnrollment(getTestPool(), contactId))?.startDate).toBe("2026-12-31");
  });

  it("signing up again never demotes an active student back to pending, and only fills blanks", async () => {
    const { contactId, enrollment } = await makeStudent({ startDate: "2026-10-05" });
    const client = await getTestPool().connect();
    try {
      const again = await upsertPendingEnrollment(client, {
        contactId,
        productId: enrollment.productId,
        goal: null,
        zone: "Sabaneta",
      });
      expect(again.id).toBe(enrollment.id);
      expect(again.status).toBe("active");
      expect(again.goal).toBe("Primera dominada");
      expect(again.zone).toBe("Sabaneta");
    } finally {
      client.release();
    }
  });

  it("activating an enrollment that doesn't exist returns null and grants nothing", async () => {
    const client = await getTestPool().connect();
    try {
      expect(await activateEnrollment(client, "00000000-0000-0000-0000-000000000000", "2026-10-05")).toBeNull();
    } finally {
      client.release();
    }
  });

  it("saveDayLog updates check-offs and note independently", async () => {
    const { enrollment } = await makeStudent({ startDate: "2026-10-05" });
    const db = getTestPool();

    await saveDayLog(db, { enrollmentId: enrollment.id, week: 1, dayIndex: 0, note: "Me dolió el hombro" });
    await saveDayLog(db, { enrollmentId: enrollment.id, week: 1, dayIndex: 0, done: [true, false, true, false] });

    let logs = await getTrainingLogs(db, enrollment.id);
    expect(logs[1][0]).toEqual({ done: [true, false, true, false], note: "Me dolió el hombro" });

    await saveDayLog(db, { enrollmentId: enrollment.id, week: 1, dayIndex: 0, note: "" });
    logs = await getTrainingLogs(db, enrollment.id);
    expect(logs[1][0]).toEqual({ done: [true, false, true, false], note: null });
  });
});
