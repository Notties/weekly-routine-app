import { describe, it, expect } from "bun:test";
import type { StateRows, SyncSlice } from "./types";
import { rowsToSlice, sliceToRows } from "./state-mapper";

describe("rowsToSlice", () => {
  it("ประกอบ slice จาก rows ครบทุกส่วน", () => {
    const rows: StateRows = {
      profile: { goal: "ลด", heightCm: 170, age: 30, workoutWindow: "19:00–20:00" },
      swaps: [{ key: "mon:0", recipeId: "r1" }],
      checked: [{ key: "ไข่" }],
      dayLogs: [
        {
          date: "2026-06-01",
          weightKg: 75,
          workoutDone: true,
          waterMl: 1500,
          extraKcal: 200,
          extraProtein: 10,
          meals: [{ mealIndex: 0 }, { mealIndex: 2 }],
          lifts: [
            { exercise: "Squat", setIndex: 0, kg: 60, reps: 8 },
            { exercise: "Squat", setIndex: 1, kg: 62.5, reps: 6 },
          ],
        },
      ],
    };
    const slice = rowsToSlice(rows);
    expect(slice.profileOverride).toEqual({
      goal: "ลด", heightCm: 170, age: 30, workoutWindow: "19:00–20:00",
    });
    expect(slice.swaps).toEqual({ "mon:0": "r1" });
    expect(slice.checked).toEqual({ ไข่: true });
    const day = slice.log["2026-06-01"];
    expect(day.weightKg).toBe(75);
    expect(day.workoutDone).toBe(true);
    expect(day.waterMl).toBe(1500);
    expect(day.extra).toEqual({ kcal: 200, protein: 10 });
    expect(day.meals).toEqual({ 0: true, 2: true });
    expect(day.lifts).toEqual({ Squat: [{ kg: 60, reps: 8 }, { kg: 62.5, reps: 6 }] });
  });

  it("profile null + field ว่าง → ละ field ที่เป็น null", () => {
    const slice = rowsToSlice({ profile: null, swaps: [], checked: [], dayLogs: [] });
    expect(slice.profileOverride).toEqual({});
    expect(slice.log).toEqual({});
  });

  it("เรียง lifts ตาม setIndex แม้ row สลับลำดับ", () => {
    const slice = rowsToSlice({
      profile: null, swaps: [], checked: [],
      dayLogs: [{
        date: "2026-06-02", weightKg: null, workoutDone: false, waterMl: 0,
        extraKcal: null, extraProtein: null, meals: [],
        lifts: [
          { exercise: "Bench", setIndex: 1, kg: 50, reps: 6 },
          { exercise: "Bench", setIndex: 0, kg: 50, reps: 8 },
        ],
      }],
    });
    expect(slice.log["2026-06-02"].lifts).toEqual({
      Bench: [{ kg: 50, reps: 8 }, { kg: 50, reps: 6 }],
    });
  });
});

describe("sliceToRows ↔ rowsToSlice round-trip", () => {
  it("slice → rows → slice ได้ค่าเดิม", () => {
    const slice: SyncSlice = {
      swaps: { "mon:0": "r1", "tue:1": "r2" },
      checked: { ไข่: true, นม: true },
      profileOverride: { goal: "เพิ่ม", age: 28 },
      log: {
        "2026-06-01": {
          weightKg: 80, workoutDone: true, waterMl: 2000,
          extra: { kcal: 300, protein: 20 },
          meals: { 1: true },
          lifts: { Deadlift: [{ kg: 100, reps: 5 }] },
        },
      },
    };
    const seed = sliceToRows(slice);
    // จำลองการอ่านกลับเป็น StateRows (เหมือนที่ Prisma จะคืน)
    const rows: StateRows = {
      profile: { goal: "เพิ่ม", heightCm: null, age: 28, workoutWindow: null },
      swaps: seed.swaps,
      checked: seed.checked,
      dayLogs: seed.days.map((d) => ({
        date: d.date, weightKg: d.weightKg, workoutDone: d.workoutDone,
        waterMl: d.waterMl, extraKcal: d.extraKcal, extraProtein: d.extraProtein,
        meals: d.meals.map((mealIndex) => ({ mealIndex })),
        lifts: d.lifts.flatMap((l) =>
          l.sets.map((s, setIndex) => ({ exercise: l.exercise, setIndex, kg: s.kg, reps: s.reps }))
        ),
      })),
    };
    expect(rowsToSlice(rows)).toEqual(slice);
  });
});
