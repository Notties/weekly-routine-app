import { describe, it, expect } from "bun:test";
import { monthlyCost, bottlesPerDay } from "./cost";
import type { ShopItem } from "@/data/types";

const items: ShopItem[] = [
  { name: "อกไก่", qty: "3กก", price: 300, category: "โปรตีน", recurring: false },
  { name: "ผัก", qty: "1กก", price: 100, category: "ผัก", recurring: false },
  { name: "เวย์", qty: "1กระปุก", price: 1290, category: "โปรตีน", recurring: true },
];

const pack = { bottles: 6, literEach: 1.5, price: 45 };

describe("bottlesPerDay", () => {
  it("3 ลิตร / ขวด 1.5 ล. = 2 ขวด", () => {
    expect(bottlesPerDay(3, 1.5)).toBe(2);
  });
});

describe("monthlyCost", () => {
  const c = monthlyCost(items, { litersPerDay: 3, pack });

  it("ของสด = (300+100) × 30/7", () => {
    expect(c.freshPerMonth).toBe(Math.round(400 * (30 / 7))); // 1714
  });

  it("ของใช้นาน = ผลรวม recurring", () => {
    expect(c.stockPerMonth).toBe(1290);
  });

  it("ค่ากิน = ของสด + ของใช้นาน", () => {
    expect(c.foodPerMonth).toBe(c.freshPerMonth + 1290);
  });

  it("น้ำ: 3 ล./วัน = 90 ล./เดือน = 60 ขวด = 10 แพ็ก", () => {
    expect(c.waterLitersPerMonth).toBe(90);
    expect(c.waterBottlesPerMonth).toBe(60);
    expect(c.waterPacksPerMonth).toBe(10);
    expect(c.waterPerMonth).toBe(450);
  });

  it("รวม = ค่ากิน + ค่าน้ำ และเฉลี่ยต่อวัน = รวม/30", () => {
    expect(c.totalPerMonth).toBe(c.foodPerMonth + 450);
    expect(c.perDay).toBe(Math.round(c.totalPerMonth / 30));
  });
});

describe("consumptionCost — ต้นทุนตามที่กินจริง", () => {
  it("คิดตามกรัมที่ใช้ × ราคาต่อกรัมของแพ็ค ไม่ใช่ราคาทั้งแพ็ค", async () => {
    const { consumptionCost } = await import("./cost");
    const catalog = [
      { name: "ไก่", qty: "3กก.", price: 300, category: "โปรตีน" as const, recurring: false, packGrams: 3000, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 }, storage: { zone: "freezer" as const, note: "x", life: "x" } },
      { name: "ถั่ว", qty: "500ก.", price: 200, category: "ไขมันดี" as const, recurring: false, packGrams: 500, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 }, storage: { zone: "pantry" as const, note: "x", life: "x" } },
    ];
    const c = consumptionCost(
      [
        { name: "ไก่", grams: 1500 }, // ครึ่งแพ็ค = 150฿
        { name: "ถั่ว", grams: 50 },  // 1/10 แพ็ค = 20฿
        { name: "ไม่มีจริง", grams: 999 }, // ข้าม
      ],
      catalog
    );
    expect(c.weeklyBaht).toBe(170);
    expect(c.monthlyBaht).toBe(Math.round(170 * (30 / 7)));
  });

  it("แผนจริง: ค่ากินจริงต่อเดือนถูกกว่างบเหมาแพ็คทุกสัปดาห์อย่างมีนัย", async () => {
    const { consumptionCost } = await import("./cost");
    const { weeklyIngredientGrams } = await import("./prep");
    const { week } = await import("@/data/week");
    const { ingredientCatalog, pantryStaples } = await import("@/data/ingredients");
    const c = consumptionCost(weeklyIngredientGrams(week, {}), [
      ...ingredientCatalog,
      ...pantryStaples,
    ]);
    // sanity: อาหารจริงควรอยู่ราวพันต้น ๆ ต่อสัปดาห์ ไม่ใช่ 1,700+ แบบเหมาแพ็ค
    expect(c.weeklyBaht).toBeGreaterThan(800);
    expect(c.weeklyBaht).toBeLessThan(1300);
  });
});
