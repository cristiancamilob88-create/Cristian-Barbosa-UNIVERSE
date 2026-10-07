import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeTestPool, getTestPool, resetActivityTables } from "@/server/db/testHelpers.integration";
import { makeStudent } from "@/server/db/trainingTestHelpers.integration";
import { hasEntitlement } from "./entitlement";
import {
  activateEnrollment,
  getEnrollmentById,
  getMemberEnrollment,
  getTrainingLogs,
  getWeekRoutines,
  saveDayLog,
  saveWeekRoutine,
  updateEnrollmentProfile,
  upsertPendingEnrollment,
} from "./training";
import { routineForWeek, type Routine } from "@/lib/training";

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
    expect(logs[1][0]).toEqual({ done: [true, false, true, false], results: [], note: "Me dolió el hombro", durationSeconds: null });

    await saveDayLog(db, { enrollmentId: enrollment.id, week: 1, dayIndex: 0, note: "" });
    logs = await getTrainingLogs(db, enrollment.id);
    expect(logs[1][0]).toEqual({ done: [true, false, true, false], results: [], note: null, durationSeconds: null });
  });
});

describe("personalized routines (phase 2)", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  const custom: Routine = [
    { title: "Pecho y tríceps", kind: "Clase con Cristian", exercises: [{ name: "Fondos en paralelas", dose: "4 × 6", cue: "" }] },
  ];

  it("'week' changes only that week — the base and every other week stay", async () => {
    const { enrollment } = await makeStudent({ startDate: "2026-10-05" });
    const client = await getTestPool().connect();
    try {
      await saveWeekRoutine(client, { enrollmentId: enrollment.id, week: 3, days: custom, mode: "week" });
    } finally {
      client.release();
    }
    const overrides = await getWeekRoutines(getTestPool(), enrollment.id);
    expect(Object.keys(overrides)).toEqual(["3"]);
    expect(overrides[3][0].title).toBe("Pecho y tríceps");
    expect((await getEnrollmentById(getTestPool(), enrollment.id))?.baseRoutine[0].title).toBe("Clase 1 · Empuje y core");
  });

  it("'forward' changes that week and later ones, and freezes earlier weeks exactly as the student saw them", async () => {
    const { enrollment } = await makeStudent({ startDate: "2026-10-05" });
    const client = await getTestPool().connect();
    try {
      // Week 2 had been customised before; week 9 too (will be replaced).
      await saveWeekRoutine(client, { enrollmentId: enrollment.id, week: 2, days: custom, mode: "week" });
      await saveWeekRoutine(client, { enrollmentId: enrollment.id, week: 9, days: custom, mode: "week" });
      const newPlan: Routine = [{ title: "Fuerza", kind: "", exercises: [{ name: "Dominadas", dose: "5 × 3", cue: "" }] }];
      await saveWeekRoutine(client, { enrollmentId: enrollment.id, week: 4, days: newPlan, mode: "forward" });
    } finally {
      client.release();
    }

    const overrides = await getWeekRoutines(getTestPool(), enrollment.id);
    const base = (await getEnrollmentById(getTestPool(), enrollment.id))!.baseRoutine;
    expect(base[0].title).toBe("Fuerza");
    // Weeks 1 and 3 froze the old beginner base; week 2 kept its own routine.
    expect(overrides[1][0].title).toBe("Clase 1 · Empuje y core");
    expect(overrides[2][0].title).toBe("Pecho y tríceps");
    expect(overrides[3][0].title).toBe("Clase 1 · Empuje y core");
    // From week 4 on everything follows the new base — week 9's old override is gone.
    expect(overrides[4]).toBeUndefined();
    expect(overrides[9]).toBeUndefined();
    expect(routineForWeek(base, overrides, 9)[0].title).toBe("Fuerza");
  });

  it("saves what the student actually did per exercise, independently of check-offs and note", async () => {
    const { enrollment } = await makeStudent({ startDate: "2026-10-05" });
    const db = getTestPool();
    await saveDayLog(db, { enrollmentId: enrollment.id, week: 1, dayIndex: 0, done: [true, true, false, false] });
    await saveDayLog(db, { enrollmentId: enrollment.id, week: 1, dayIndex: 0, results: ["10, 8, 8", "", "35 s", ""] });
    const logs = await getTrainingLogs(db, enrollment.id);
    expect(logs[1][0]).toEqual({ done: [true, true, false, false], results: ["10, 8, 8", "", "35 s", ""], note: null, durationSeconds: null });
  });

  it("updates the student's profile: objective, goal, level, zone", async () => {
    const { enrollment } = await makeStudent();
    const client = await getTestPool().connect();
    try {
      const updated = await updateEnrollmentProfile(client, enrollment.id, {
        objective: "bajar_peso",
        goal: "Bajar 6 kg",
        level: "intermedio",
        zone: "Sabaneta",
      });
      expect(updated).toMatchObject({ objective: "bajar_peso", goal: "Bajar 6 kg", level: "intermedio", zone: "Sabaneta" });
    } finally {
      client.release();
    }
  });
});
