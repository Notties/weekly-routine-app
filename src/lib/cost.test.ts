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
