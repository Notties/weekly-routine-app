import { describe, it, expect } from "bun:test";
import { MigrateSchema } from "./schemas";

describe("MigrateSchema", () => {
  it("รับ SyncSlice ที่ถูกต้อง", () => {
    const ok = MigrateSchema.safeParse({
      swaps: { "mon:0": "r1" },
      checked: { ไข่: true },
      profileOverride: { goal: "ลด", age: 30 },
      log: { "2026-06-01": { weightKg: 75, meals: { 0: true }, lifts: { Squat: [{ kg: 60, reps: 8 }] } } },
    });
    expect(ok.success).toBe(true);
  });

  it("ปฏิเสธ lifts ที่ reps ไม่ใช่ int", () => {
    const bad = MigrateSchema.safeParse({
      swaps: {}, checked: {}, profileOverride: {},
      log: { "2026-06-01": { lifts: { Squat: [{ kg: 60, reps: 8.5 }] } } },
    });
    expect(bad.success).toBe(false);
  });
});
