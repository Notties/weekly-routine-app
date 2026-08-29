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
  it("แผนหมุนเวียน: เวต 480 ไก่ · อ/ส หมู 200+ไก่ 200 · พฤ ไก่ 350 (เต้าหู้ไข่) · อา ไก่ 400", () => {
    const bags = meatBags(week, {});
    const byDay = Object.fromEntries(bags.map((b) => [b.day, b]));
    for (const d of ["mon", "wed", "fri"] as const) {
      expect(byDay[d].items).toEqual([{ name: "อกไก่", grams: 480 }]);
    }
    for (const d of ["tue", "sat"] as const) {
      expect(byDay[d].items).toEqual([
        { name: "หมูสันใน", grams: 200 },
        { name: "อกไก่", grams: 200 },
      ]);
    }
    expect(byDay.thu.items).toEqual([{ name: "อกไก่", grams: 350 }]);
    expect(byDay.sun.items).toEqual([{ name: "อกไก่", grams: 400 }]);
  });

  it("รวมทั้งสัปดาห์ = ไก่ 2,590 + หมู 400 = 2,990 ก.", () => {
    const total = meatBags(week, {}).reduce((s, b) => s + b.total, 0);
    expect(total).toBe(2990);
  });

  it("สลับเที่ยงเสาร์กลับเป็นไก่ → ถุงเสาร์รวมเป็นอกไก่ 400 ก้อนเดียว", () => {
    const bags = meatBags(week, { "sat:1": "ln-chicken" });
    const sat = bags.find((b) => b.day === "sat")!;
    expect(sat.items).toEqual([{ name: "อกไก่", grams: 400 }]);
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

  it("คืนจันทร์ → เตือนถุงอังคาร หมู 200 + ไก่ 200", () => {
    const note = bagMoveNote(week, {}, "mon");
    expect(note).toContain("หมูสันใน 200 ก.");
    expect(note).toContain("อกไก่ 200 ก.");
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

  it("ไก่ 2,590 · หมู 400 · ไข่ 300 · ข้าวสวยสุก 1,800 (เฟสคัต) · วอลนัท 105 · แอปเปิล 600", () => {
    expect(totals.get("อกไก่")).toBe(2590);
    expect(totals.get("หมูสันใน")).toBe(400);
    expect(totals.get("ไข่ไก่")).toBe(300);
    expect(totals.get("ข้าวหอมมะลิ")).toBe(1800);
    expect(totals.get("วอลนัท")).toBe(105);
    expect(totals.get("แอปเปิล")).toBe(600);
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
