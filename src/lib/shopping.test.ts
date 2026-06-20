import { describe, it, expect } from "bun:test";
import { shoppingTotals, groupByCategory } from "./shopping";
import type { ShopItem } from "@/data/types";

const items: ShopItem[] = [
  { name: "อกไก่", qty: "1กก", price: 100, category: "โปรตีน", recurring: false },
  { name: "ไข่", qty: "30ฟอง", price: 140, category: "โปรตีน", recurring: false },
  { name: "เวย์", qty: "1กระปุก", price: 900, category: "โปรตีน", recurring: true },
  { name: "ข้าวกล้อง", qty: "5กก", price: 250, category: "คาร์บ", recurring: true },
  { name: "ขนมปัง", qty: "1แถว", price: 60, category: "คาร์บ", recurring: false },
];

describe("groupByCategory", () => {
  it("จัดกลุ่มตามหมวด", () => {
    const g = groupByCategory(items);
    expect(g["โปรตีน"]?.length).toBe(3);
    expect(g["คาร์บ"]?.length).toBe(2);
  });
});

describe("shoppingTotals", () => {
  const t = shoppingTotals(items);

  it("รวมราคาแต่ละหมวด", () => {
    expect(t.byCategory["โปรตีน"]).toBe(1140);
    expect(t.byCategory["คาร์บ"]).toBe(310);
  });

  it("รวมราคาทั้งหมด", () => {
    expect(t.grandTotal).toBe(1450);
  });

  it("งบสัปดาห์ = ผลรวมของที่ recurring=false", () => {
    // 100 + 140 + 60 = 300
    expect(t.weeklyTotal).toBe(300);
  });

  it("ของใช้นาน = ผลรวมของที่ recurring=true", () => {
    // 900 + 250 = 1150
    expect(t.oneTimeTotal).toBe(1150);
  });

  it("เฉลี่ยต่อวัน = งบสัปดาห์ / 7", () => {
    expect(t.perDay).toBeCloseTo(300 / 7);
  });

  it("รับลิสต์ว่างได้โดยไม่พัง", () => {
    const z = shoppingTotals([]);
    expect(z.grandTotal).toBe(0);
    expect(z.perDay).toBe(0);
  });
});
