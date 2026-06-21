import { describe, it, expect } from "bun:test";
import { macrosOf, sumMacros, dailyTarget } from "./nutrition";
import { profile } from "@/data/profile";

describe("macrosOf", () => {
  it("อกไก่ 200 ก. = 2 เท่าของต่อ 100 ก.", () => {
    expect(macrosOf("อกไก่", 200)).toEqual({ kcal: 240, protein: 46, carb: 0, fat: 5 });
  });

  it("หาเจอใน pantry ด้วย (น้ำมันรำข้าว 5 ก.)", () => {
    const m = macrosOf("น้ำมันรำข้าว", 5);
    expect(m.kcal).toBeCloseTo(44.2, 1);
    expect(m.fat).toBeCloseTo(5, 1);
  });

  it("ชื่อที่ไม่รู้จัก → ทุกค่าเป็น 0", () => {
    expect(macrosOf("ไม่มีจริง", 100)).toEqual({ kcal: 0, protein: 0, carb: 0, fat: 0 });
  });
});

describe("sumMacros", () => {
  it("รวมหลายมื้อ", () => {
    expect(
      sumMacros([
        { kcal: 100, protein: 10, carb: 5, fat: 2 },
        { kcal: 200, protein: 20, carb: 10, fat: 3 },
      ])
    ).toEqual({ kcal: 300, protein: 30, carb: 15, fat: 5 });
  });

  it("ลิสต์ว่าง = 0", () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, carb: 0, fat: 0 });
  });
});

describe("dailyTarget (ชาย 75 กก./167/25)", () => {
  it("วันเล่นเวต", () => {
    expect(dailyTarget(profile, "weights")).toEqual({ kcal: 2200, protein: 150, carb: 265, fat: 60 });
  });
  it("วันคาร์ดิโอ", () => {
    expect(dailyTarget(profile, "cardio")).toEqual({ kcal: 2050, protein: 150, carb: 228, fat: 60 });
  });
  it("วันพัก", () => {
    expect(dailyTarget(profile, "rest")).toEqual({ kcal: 1850, protein: 150, carb: 178, fat: 60 });
  });
});
