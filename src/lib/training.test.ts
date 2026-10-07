import { describe, expect, it } from "vitest";
import {
  currentWeek,
  formatDuration,
  measurementInputSchema,
  parseRoutine,
  routineForWeek,
  todayInBogota,
  weekCompletion,
  weekRange,
  weekStanding,
  type Routine,
} from "./training";

const routine: Routine = [
  {
    title: "Clase 1",
    kind: "Clase con Cristian",
    exercises: [
      { name: "Flexiones", dose: "3 × 8", cue: "" },
      { name: "Plancha", dose: "3 × 30 s", cue: "" },
    ],
  },
  { title: "Casa", kind: "Por tu cuenta", exercises: [{ name: "Zancadas", dose: "3 × 10", cue: "" }] },
];

describe("currentWeek", () => {
  it("is week 1 on the start date and through its sixth day", () => {
    expect(currentWeek("2026-10-05", 12, "2026-10-05")).toBe(1);
    expect(currentWeek("2026-10-05", 12, "2026-10-11")).toBe(1);
  });

  it("rolls to week 2 on day 7", () => {
    expect(currentWeek("2026-10-05", 12, "2026-10-12")).toBe(2);
  });

  it("clamps before the start and after the end", () => {
    expect(currentWeek("2026-10-05", 12, "2026-09-01")).toBe(1);
    expect(currentWeek("2026-10-05", 12, "2027-06-01")).toBe(12);
  });

  it("crosses a month and a year boundary correctly", () => {
    expect(currentWeek("2026-12-28", 12, "2027-01-04")).toBe(2);
  });
});

describe("todayInBogota", () => {
  it("uses Colombia's date, not UTC's — 02:00 UTC is still the previous day in Bogotá", () => {
    expect(todayInBogota(new Date("2026-10-06T02:00:00Z"))).toBe("2026-10-05");
    expect(todayInBogota(new Date("2026-10-06T06:00:00Z"))).toBe("2026-10-06");
  });
});

describe("weekRange", () => {
  it("spans seven days starting from the week's first day", () => {
    expect(weekRange("2026-10-05", 1)).toEqual({ from: "2026-10-05", to: "2026-10-11" });
    expect(weekRange("2026-10-05", 4)).toEqual({ from: "2026-10-26", to: "2026-11-01" });
  });
});

describe("routineForWeek", () => {
  it("uses a week's own routine when it has one, otherwise the base", () => {
    const override: Routine = [{ title: "Otra", kind: "", exercises: [{ name: "Dominadas", dose: "", cue: "" }] }];
    expect(routineForWeek(routine, { 3: override }, 3)).toBe(override);
    expect(routineForWeek(routine, { 3: override }, 2)).toBe(routine);
  });
});

describe("weekCompletion", () => {
  it("counts checked exercises across every day", () => {
    expect(weekCompletion(routine, { 0: { done: [true, false], results: [], note: null, durationSeconds: null }, 1: { done: [true], results: [], note: null, durationSeconds: null } })).toEqual({
      done: 2,
      total: 3,
      percent: 67,
    });
  });

  it("ignores checks beyond the routine's exercises (a routine that got shorter)", () => {
    expect(weekCompletion(routine, { 1: { done: [true, true, true], results: [], note: null, durationSeconds: null } }).done).toBe(1);
  });

  it("is 0% with nothing logged, and never divides by zero on an empty routine", () => {
    expect(weekCompletion(routine, undefined).percent).toBe(0);
    expect(weekCompletion([], undefined)).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

describe("weekStanding", () => {
  it("applies the 80/40 thresholds", () => {
    expect(weekStanding(80, true).standing).toBe("good");
    expect(weekStanding(79, true).standing).toBe("warn");
    expect(weekStanding(40, true).standing).toBe("warn");
    expect(weekStanding(39, true).standing).toBe("bad");
  });

  it("says 'Sin registros' — not 'falling behind' — when nothing was logged", () => {
    expect(weekStanding(0, false)).toEqual({ standing: "idle", label: "Sin registros" });
  });
});

describe("parseRoutine", () => {
  it("accepts a valid routine and fills optional fields", () => {
    const parsed = parseRoutine([{ title: "Día", exercises: [{ name: "Flexiones" }] }]);
    expect(parsed[0]).toEqual({ title: "Día", kind: "", exercises: [{ name: "Flexiones", dose: "", cue: "" }] });
  });

  it("degrades a malformed value to an empty routine instead of throwing", () => {
    expect(parseRoutine({ not: "a routine" })).toEqual([]);
    expect(parseRoutine(null)).toEqual([]);
  });
});

describe("formatDuration", () => {
  it("shows m:ss under an hour and h:mm:ss above", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(1930)).toBe("32:10");
    expect(formatDuration(3900)).toBe("1:05:00");
  });
});

describe("measurementInputSchema", () => {
  it("needs a date and at least one result", () => {
    expect(measurementInputSchema.safeParse({ measuredOn: "2026-10-07" }).success).toBe(false);
    expect(measurementInputSchema.safeParse({ measuredOn: "2026-10-07", pushUps: 20 }).success).toBe(true);
  });

  it("rejects impossible numbers", () => {
    expect(measurementInputSchema.safeParse({ measuredOn: "2026-10-07", pushUps: -1 }).success).toBe(false);
    expect(measurementInputSchema.safeParse({ measuredOn: "2026-10-07", weightKg: 5 }).success).toBe(false);
  });
});
