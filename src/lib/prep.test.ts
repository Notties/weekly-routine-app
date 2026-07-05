import { describe, it, expect } from "bun:test";
import { week } from "@/data/week";
import { ingredientCatalog, pantryStaples } from "@/data/ingredients";
import {
  meatBags,
  weeklyIngredientGrams,
  groupByStorageZone,
} from "./prep";

describe("meatBags — แบ่งเนื้อถุงรายวัน", () => {
  it("แผนเริ่มต้น: วันเวต 370 ก. วันพัก 200 ก. (อกไก่ล้วน)", () => {
    const bags = meatBags(week, {});
    const byDay = Object.fromEntries(bags.map((b) => [b.day, b]));
    expect(byDay.mon.total).toBe(370);
    expect(byDay.tue.total).toBe(200);
    expect(byDay.wed.total).toBe(370);
    expect(byDay.thu.total).toBe(200);
    expect(byDay.fri.total).toBe(370);
    expect(byDay.sat.total).toBe(200);
    expect(byDay.sun.total).toBe(200);
    for (const b of bags) {
      expect(b.items).toEqual([{ name: "อกไก่", grams: b.total }]);
    }
  });

  it("รวมทั้งสัปดาห์ = 1,910 ก.", () => {
    const total = meatBags(week, {}).reduce((s, b) => s + b.total, 0);
    expect(total).toBe(1910);
  });

  it("สลับมื้อเที่ยงอังคารเป็นหมู → ถุงอังคารเป็นหมูสันใน 200 ก.", () => {
    // อังคาร index 1 = มื้อกลางวัน (ln-chicken → ln-pork)
    const bags = meatBags(week, { "tue:1": "ln-pork" });
    const tue = bags.find((b) => b.day === "tue")!;
    expect(tue.items).toEqual([{ name: "หมูสันใน", grams: 200 }]);
  });

  it("สลับเป็นเมนูไข่ (ไม่มีเนื้อ) → ถุงว่าง", () => {
    const bags = meatBags(week, { "tue:1": "ln-omelet" });
    const tue = bags.find((b) => b.day === "tue")!;
    expect(tue.total).toBe(0);
    expect(tue.items).toEqual([]);
  });
});

describe("weeklyIngredientGrams — กรัมรวมต่อสัปดาห์", () => {
  const totals = new Map(
    weeklyIngredientGrams(week, {}).map((t) => [t.name, t.grams])
  );

  it("อกไก่ 1,910 · ไข่ 1,500 (30 ฟองพอดี) · ข้าวสุก 2,230", () => {
    expect(totals.get("อกไก่")).toBe(1910);
    expect(totals.get("ไข่ไก่")).toBe(1500);
    expect(totals.get("ข้าวกล้อง")).toBe(2230);
  });

  it("เรียงจากมากไปน้อย", () => {
    const grams = weeklyIngredientGrams(week, {}).map((t) => t.grams);
    expect([...grams].sort((a, b) => b - a)).toEqual(grams);
  });
});

describe("storage — ข้อมูลการเก็บครบทุกรายการ", () => {
  it("ทุกรายการใน catalog + pantry มีโซน/โน้ต/อายุ", () => {
    for (const item of [...ingredientCatalog, ...pantryStaples]) {
      expect(["fridge", "freezer", "pantry"]).toContain(item.storage.zone);
      expect(item.storage.note.length).toBeGreaterThan(0);
      expect(item.storage.life.length).toBeGreaterThan(0);
    }
  });

  it("จัดกลุ่มตามโซนถูกต้อง (อกไก่→แช่แข็ง, ไข่→ตู้เย็น, ข้าวโอ๊ต→นอกตู้)", () => {
    const zones = groupByStorageZone(["อกไก่", "ไข่ไก่", "ข้าวโอ๊ต"]);
    expect(zones.freezer.map((i) => i.name)).toEqual(["อกไก่"]);
    expect(zones.fridge.map((i) => i.name)).toEqual(["ไข่ไก่"]);
    expect(zones.pantry.map((i) => i.name)).toEqual(["ข้าวโอ๊ต"]);
  });

  it("ชื่อที่ไม่รู้จักถูกข้าม ไม่พัง", () => {
    const zones = groupByStorageZone(["ไม่มีจริง"]);
    expect(zones.fridge).toEqual([]);
    expect(zones.freezer).toEqual([]);
    expect(zones.pantry).toEqual([]);
  });
});
