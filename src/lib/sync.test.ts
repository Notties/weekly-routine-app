import { describe, it, expect } from "bun:test";
import type { SyncSlice } from "./sync";
import { mergeSlice } from "./sync";

const empty: SyncSlice = { swaps: {}, checked: {}, log: {}, profileOverride: {} };

describe("mergeSlice — union ไม่ทำของหาย", () => {
  it("รวม key ที่ต่างกันของทั้งสองฝั่ง", () => {
    const local: SyncSlice = {
      ...empty,
      swaps: { "mon:0": "a" },
      log: { "2026-06-01": { weightKg: 75 } },
    };
    const remote: SyncSlice = {
      ...empty,
      swaps: { "tue:1": "b" },
      log: { "2026-06-02": { weightKg: 74 } },
    };
    const m = mergeSlice(local, remote, true);
    expect(m.swaps).toEqual({ "mon:0": "a", "tue:1": "b" });
    expect(Object.keys(m.log).sort()).toEqual(["2026-06-01", "2026-06-02"]);
  });
});

describe("mergeSlice — key ชนกัน ฝั่งใหม่ชนะ", () => {
  const local: SyncSlice = { ...empty, swaps: { "mon:0": "local" } };
  const remote: SyncSlice = { ...empty, swaps: { "mon:0": "remote" } };
  it("localNewer → ใช้ค่า local", () => {
    expect(mergeSlice(local, remote, true).swaps["mon:0"]).toBe("local");
  });
  it("remote ใหม่กว่า → ใช้ค่า remote", () => {
    expect(mergeSlice(local, remote, false).swaps["mon:0"]).toBe("remote");
  });
});

describe("mergeSlice — log วันเดียวกัน merge ย่อย", () => {
  it("union meals + lifts ของวันเดียวกัน (ไม่ทับทั้งวัน)", () => {
    const local: SyncSlice = {
      ...empty,
      log: {
        "2026-06-01": {
          meals: { 0: true },
          lifts: { "Barbell Squat": [{ kg: 60, reps: 8 }] },
        },
      },
    };
    const remote: SyncSlice = {
      ...empty,
      log: {
        "2026-06-01": {
          meals: { 1: true },
          workoutDone: true,
          lifts: { "Bench Press": [{ kg: 50, reps: 8 }] },
        },
      },
    };
    const day = mergeSlice(local, remote, true).log["2026-06-01"];
    expect(day.meals).toEqual({ 0: true, 1: true });
    expect(day.workoutDone).toBe(true);
    expect(Object.keys(day.lifts!).sort()).toEqual([
      "Barbell Squat",
      "Bench Press",
    ]);
  });

  it("ฟิลด์สเกลาร์ชนกัน → ฝั่งใหม่ชนะ", () => {
    const local: SyncSlice = { ...empty, log: { "2026-06-01": { weightKg: 75 } } };
    const remote: SyncSlice = { ...empty, log: { "2026-06-01": { weightKg: 74 } } };
    expect(mergeSlice(local, remote, false).log["2026-06-01"].weightKg).toBe(74);
    expect(mergeSlice(local, remote, true).log["2026-06-01"].weightKg).toBe(75);
  });

  it("lift ท่าเดียวกันชนกัน → ฝั่งใหม่ชนะ", () => {
    const local: SyncSlice = {
      ...empty,
      log: { "2026-06-01": { lifts: { Squat: [{ kg: 60, reps: 8 }] } } },
    };
    const remote: SyncSlice = {
      ...empty,
      log: { "2026-06-01": { lifts: { Squat: [{ kg: 62.5, reps: 6 }] } } },
    };
    expect(
      mergeSlice(local, remote, false).log["2026-06-01"].lifts!.Squat
    ).toEqual([{ kg: 62.5, reps: 6 }]);
  });
});

describe("mergeSlice — profileOverride", () => {
  it("union + ฝั่งใหม่ชนะ field ที่ชน", () => {
    const local: SyncSlice = { ...empty, profileOverride: { goal: "A", age: 25 } };
    const remote: SyncSlice = { ...empty, profileOverride: { goal: "B", heightCm: 170 } };
    expect(mergeSlice(local, remote, false).profileOverride).toEqual({
      goal: "B",
      age: 25,
      heightCm: 170,
    });
  });
});
