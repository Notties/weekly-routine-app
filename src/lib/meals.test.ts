import { describe, it, expect } from "bun:test";
import { week } from "@/data/week";
import {
  resolveDay,
  resolveMeal,
  recipesForSlot,
  activeRecipeIds,
} from "./meals";
import { computeShoppingItems, buildShoppingItems } from "./shopping";
import type { CatalogItem } from "@/data/types";

describe("resolveDay / resolveMeal", () => {
  const mon = week.find((d) => d.key === "mon")!;

  it("resolve เมนูเริ่มต้นถูกต้อง (มื้อเช้าจันทร์ = ข้าวโอ๊ต)", () => {
    const rd = resolveDay(mon, {});
    expect(rd.meals.length).toBe(4);
    expect(rd.meals[0].name).toBe("มื้อเช้า");
    expect(rd.meals[0].menu).toContain("ข้าวโอ๊ต");
    expect(rd.meals[0].recipeId).toBe("bf-oat");
  });

  it("สลับเมนูแล้ว menu เปลี่ยนตาม", () => {
    const m = resolveMeal("mon", 0, mon.meals[0], { "mon:0": "bf-bread" });
    expect(m.recipeId).toBe("bf-bread");
    expect(m.menu).toContain("ขนมปัง");
  });

  it("สลับด้วย id ที่ไม่มีอยู่ → กลับไปใช้เมนูเริ่มต้น", () => {
    const m = resolveMeal("mon", 0, mon.meals[0], { "mon:0": "ไม่มีจริง" });
    expect(m.recipeId).toBe("bf-oat");
  });
});

describe("recipesForSlot", () => {
  it("มื้อเช้ามีหลายตัวเลือก", () => {
    expect(recipesForSlot("breakfast").length).toBeGreaterThanOrEqual(2);
  });
});

describe("computeShoppingItems (วัตถุดิบเปลี่ยนตามเมนู)", () => {
  it("ค่าเริ่มต้น: มีอกไก่ + หมู (อ/ส) + ของครัวพื้นฐาน แต่ไม่มีเวย์", () => {
    const items = computeShoppingItems(week, {});
    const names = items.map((i) => i.name);
    expect(names).toContain("อกไก่");
    expect(names).toContain("หมูสันใน");
    expect(names).toContain("น้ำมันรำข้าว");
    expect(names).not.toContain("เวย์โปรตีน");
  });

  it("สลับมื้อกลางวันอังคารเป็นเมนูหมู → หมูโผล่ในรายการซื้อของ", () => {
    const items = computeShoppingItems(week, { "tue:1": "ln-pork" });
    expect(items.map((i) => i.name)).toContain("หมูสันใน");
  });

  it("ไม่มีรายการซ้ำชื่อ", () => {
    const names = computeShoppingItems(week, {}).map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("buildShoppingItems", () => {
  const catalog: CatalogItem[] = [
    { storage: { zone: "fridge", note: "ทั้งแผงชั้นในตู้", life: "3–5 สัปดาห์" }, name: "ไข่", qty: "30", price: 140, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 143, protein: 12.6, carb: 0.7, fat: 9.5 } },
    { storage: { zone: "pantry", note: "โหลปิดสนิท", life: "หลายเดือน" }, name: "ข้าว", qty: "5กก", price: 250, category: "คาร์บ", recurring: true, macrosPer100g: { kcal: 130, protein: 2.7, carb: 28, fat: 0.3 } },
  ];
  const pantry: CatalogItem[] = [
    { storage: { zone: "pantry", note: "ที่มืดพ้นแดด", life: "หลายเดือน" }, name: "น้ำมัน", qty: "1", price: 200, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 884, protein: 0, carb: 0, fat: 100 } },
  ];

  it("หยิบเฉพาะวัตถุดิบที่ใช้ + เติม pantry เสมอ", () => {
    const items = buildShoppingItems(new Set(["ไข่"]), catalog, pantry);
    const names = items.map((i) => i.name);
    expect(names).toContain("ไข่");
    expect(names).toContain("น้ำมัน");
    expect(names).not.toContain("ข้าว");
  });
});

describe("activeRecipeIds", () => {
  it("รวมเมนูที่ใช้จริงทั้งสัปดาห์", () => {
    const ids = activeRecipeIds(week, {});
    expect(ids).toContain("ln-chicken");
    expect(ids.length).toBeGreaterThan(7);
  });
});
