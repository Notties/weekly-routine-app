import { describe, it, expect } from "bun:test";
import { week } from "@/data/week";
import { profile } from "@/data/profile";
import {
  dayKeyForDate,
  effectiveWeight,
  effectiveProfile,
  dayAdherence,
  computeStreak,
  daysHitInLast,
  adherenceHistory,
  WATER_TARGET_ML,
} from "./tracking";
import type { DayLog, ISODate } from "@/data/types";

describe("dayKeyForDate", () => {
  it("2026-06-21 = อาทิตย์ (sun)", () => {
    expect(dayKeyForDate("2026-06-21")).toBe("sun");
  });
  it("2026-06-22 = จันทร์ (mon)", () => {
    expect(dayKeyForDate("2026-06-22")).toBe("mon");
  });
});

describe("effectiveWeight", () => {
  it("เลือก entry วันที่ล่าสุด", () => {
    const log = {
      "2026-06-01": { weightKg: 77 },
      "2026-06-21": { weightKg: 75 },
    };
    expect(effectiveWeight(log, 70)).toBe(75);
  });
  it("ไม่มีข้อมูล → fallback", () => {
    expect(effectiveWeight({}, 70)).toBe(70);
  });
});

describe("effectiveProfile", () => {
  it("merge override + น้ำหนักล่าสุดจาก log", () => {
    const eff = effectiveProfile(
      profile,
      { goal: "เพิ่มกล้ามล้วน", heightCm: 170 },
      { "2026-06-21": { weightKg: 73 } }
    );
    expect(eff.weightKg).toBe(73);
    expect(eff.goal).toBe("เพิ่มกล้ามล้วน");
    expect(eff.heightCm).toBe(170);
    expect(eff.age).toBe(profile.age);
  });
});

describe("dayAdherence", () => {
  it("วันเล่นเวต (จันทร์): 4 มื้อ + เล่น + น้ำ = total 6", () => {
    const mon = week.find((d) => d.key === "mon")!;
    const dayLog: DayLog = { meals: { 0: true, 1: true }, workoutDone: true, waterMl: 1500 };
    expect(dayAdherence(mon, dayLog, WATER_TARGET_ML)).toEqual({ done: 3, total: 6, pct: 50 });
  });
  it("วันพัก (อาทิตย์) ทำครบ = 100%", () => {
    const sun = week.find((d) => d.key === "sun")!;
    const dayLog: DayLog = { meals: { 0: true, 1: true, 2: true, 3: true }, waterMl: 3000 };
    const a = dayAdherence(sun, dayLog, WATER_TARGET_ML);
    expect(a.pct).toBe(100);
  });
  it("ไม่มี log = 0%", () => {
    const sun = week.find((d) => d.key === "sun")!;
    expect(dayAdherence(sun, undefined, WATER_TARGET_ML).pct).toBe(0);
  });
});

describe("computeStreak / daysHitInLast", () => {
  const full: DayLog = { meals: { 0: true, 1: true, 2: true, 3: true }, waterMl: 3000 };
  const log: Record<ISODate, DayLog> = {
    "2026-06-21": full, // อา (rest, total 5) 100%
    "2026-06-20": full, // ส (rest) 100%
    // 2026-06-19 (ศ) ไม่มี log → หยุดสตรีค
  };
  it("สตรีคนับวันต่อเนื่องที่ ≥80%", () => {
    expect(computeStreak(log, week, "2026-06-21", WATER_TARGET_ML)).toBe(2);
  });
  it("ทำครบใน 7 วันล่าสุด", () => {
    expect(daysHitInLast(log, week, "2026-06-21", 7, WATER_TARGET_ML)).toBe(2);
  });
});

describe("adherenceHistory", () => {
  const full: DayLog = { meals: { 0: true, 1: true, 2: true, 3: true }, waterMl: 3000 };
  const log = { "2026-06-21": full };
  const cells = adherenceHistory(log, week, "2026-06-21", 8);

  it("ความยาว = weeks*7", () => {
    expect(cells.length).toBe(56);
  });
  it("เริ่มที่วันอาทิตย์", () => {
    expect(dayKeyForDate(cells[0].date)).toBe("sun");
  });
  it("วันนี้อยู่ index 49 และ pct ตามจริง (อา เต็มวัน = 100)", () => {
    expect(cells[49].date).toBe("2026-06-21");
    expect(cells[49].pct).toBe(100);
  });
  it("วันอนาคต (หลังวันนี้) = null", () => {
    expect(cells[50].pct).toBeNull();
    expect(cells[55].pct).toBeNull();
  });
  it("วันก่อนหน้าที่ไม่มี log = 0 (ไม่ใช่ null)", () => {
    expect(cells[0].pct).toBe(0);
  });
});
