import { describe, it, expect } from "bun:test";
import { week } from "@/data/week";
import { ingredientCatalog, pantryStaples } from "@/data/ingredients";
import {
  meatBags,
  weeklyIngredientGrams,
  groupByStorageZone,
  bagMoveNote,
} from "./prep";

describe("meatBags — แบ่งเนื้อถุงรายวัน", () => {
  it("แผนเริ่มต้น: วันเวต 480 ก. (เที่ยง 200+หลังเล่น 280) วันพัก 400 ก. (เที่ยง+เย็น)", () => {
    const bags = meatBags(week, {});
    const byDay = Object.fromEntries(bags.map((b) => [b.day, b]));
    expect(byDay.mon.total).toBe(480);
    expect(byDay.tue.total).toBe(400);
    expect(byDay.wed.total).toBe(480);
    expect(byDay.thu.total).toBe(400);
    expect(byDay.fri.total).toBe(480);
    expect(byDay.sat.total).toBe(400);
    expect(byDay.sun.total).toBe(400);
    for (const b of bags) {
      expect(b.items).toEqual([{ name: "อกไก่", grams: b.total }]);
    }
  });

  it("รวมทั้งสัปดาห์ = 3,040 ก. (แพ็ค 3 กก. พอดี)", () => {
    const total = meatBags(week, {}).reduce((s, b) => s + b.total, 0);
    expect(total).toBe(3040);
  });

  it("สลับมื้อเที่ยงอังคารเป็นหมู → ถุงผสม หมู 200 + ไก่ 200 (มื้อเย็น)", () => {
    // อังคาร index 1 = มื้อกลางวัน (ln-chicken → ln-pork)
    const bags = meatBags(week, { "tue:1": "ln-pork" });
    const tue = bags.find((b) => b.day === "tue")!;
    expect(tue.items).toEqual([
      { name: "หมูสันใน", grams: 200 },
      { name: "อกไก่", grams: 200 },
    ]);
  });

  it("สลับทั้งเที่ยง+เย็นเป็นเมนูไม่มีเนื้อ → ถุงว่าง", () => {
    const bags = meatBags(week, {
      "tue:1": "ln-omelet",
      "tue:3": "dn-eggveg",
    });
    const tue = bags.find((b) => b.day === "tue")!;
    expect(tue.total).toBe(0);
    expect(tue.items).toEqual([]);
  });
});

describe("bagMoveNote — เตือนย้ายถุงเนื้อพรุ่งนี้", () => {
  it("คืนอาทิตย์ → เตือนถุงจันทร์ 480 ก.", () => {
    const note = bagMoveNote(week, {}, "sun");
    expect(note).toContain("อกไก่ 480 ก.");
    expect(note).toContain("จันทร์");
  });

  it("คืนจันทร์ → เตือนถุงอังคาร 400 ก.", () => {
    expect(bagMoveNote(week, {}, "mon")).toContain("อกไก่ 400 ก.");
  });

  it("พรุ่งนี้ไม่มีเนื้อเลย (สลับทั้งเที่ยง+เย็น) → null", () => {
    expect(
      bagMoveNote(week, { "tue:1": "ln-omelet", "tue:3": "dn-eggveg" }, "mon")
    ).toBeNull();
  });

  it("วันไม่รู้จัก → null", () => {
    expect(bagMoveNote(week, {}, "xxx" as never)).toBeNull();
  });
});

describe("weeklyIngredientGrams — กรัมรวมต่อสัปดาห์", () => {
  const totals = new Map(
    weeklyIngredientGrams(week, {}).map((t) => [t.name, t.grams])
  );

  it("อกไก่ 3,040 · ไข่ 300 (6 ฟอง — คุมคอเลสเตอรอล) · ข้าวสวยสุก 2,950", () => {
    expect(totals.get("อกไก่")).toBe(3040);
    expect(totals.get("ไข่ไก่")).toBe(300);
    expect(totals.get("ข้าวหอมมะลิ")).toBe(2950);
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
