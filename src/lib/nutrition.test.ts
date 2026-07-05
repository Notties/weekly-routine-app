import { describe, it, expect } from "bun:test";
import { macrosOf, sumMacros, dailyTarget, recipeMacros } from "./nutrition";
import { profile } from "@/data/profile";
import { getRecipe, resolveDay } from "./meals";
import { week } from "@/data/week";

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

describe("recipeMacros", () => {
  it("ln-chicken = 613/54/72/11 (ข้าวขาว USDA #168878 + บรอกโคลี/แครอท)", () => {
    const r = getRecipe("ln-chicken")!;
    expect(recipeMacros(r)).toEqual({ kcal: 613, protein: 54, carb: 72, fat: 11 });
  });

  it("po-whey-rice โปรตีนสูง (= 72 ก.)", () => {
    const r = getRecipe("po-whey-rice")!;
    expect(recipeMacros(r).protein).toBe(72);
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

describe("สมดุลทั้งสัปดาห์ — แต่ละวันใกล้เป้า", () => {
  for (const day of week) {
    it(`${day.label}: kcal อยู่ใน ±6% และโปรตีน ≥ 145 ก.`, () => {
      const rd = resolveDay(day, {});
      const total = sumMacros(rd.meals.map((m) => m.macros));
      const target = dailyTarget(profile, day.type);
      expect(total.kcal).toBeGreaterThanOrEqual(target.kcal * 0.94);
      expect(total.kcal).toBeLessThanOrEqual(target.kcal * 1.06);
      expect(total.protein).toBeGreaterThanOrEqual(145);
    });
  }
});
