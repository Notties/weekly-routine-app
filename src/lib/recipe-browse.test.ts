import { describe, it, expect } from "bun:test";
import { recipes } from "@/data/recipes";
import { week } from "@/data/week";
import { recipeMacros } from "./nutrition";
import {
  searchRecipes,
  sortRecipes,
  recipeUsage,
  slotOptions,
} from "./recipe-browse";

describe("searchRecipes", () => {
  it("ค้นจากชื่อเมนู", () => {
    const found = searchRecipes(recipes, "โอ๊ต");
    expect(found.map((r) => r.id)).toContain("bf-oat");
  });

  it("ค้นจากชื่อวัตถุดิบ (พิมพ์ 'ไข่' เจอเมนูที่ใช้ไข่แม้ชื่อไม่มีคำว่าไข่)", () => {
    const found = searchRecipes(recipes, "ไข่");
    expect(found.map((r) => r.id)).toContain("dst-mugcake"); // เค้กถ้วยใช้ไข่
  });

  it("เว้นว่าง/ช่องว่างล้วน → คืนทั้งหมด", () => {
    expect(searchRecipes(recipes, "")).toHaveLength(recipes.length);
    expect(searchRecipes(recipes, "  ")).toHaveLength(recipes.length);
  });

  it("ไม่เจอ → ลิสต์ว่าง", () => {
    expect(searchRecipes(recipes, "พิซซ่า")).toHaveLength(0);
  });
});

describe("sortRecipes", () => {
  it("protein → โปรตีนมากไปน้อย", () => {
    const sorted = sortRecipes(recipes, "protein");
    const p = sorted.map((r) => recipeMacros(r).protein);
    expect([...p].sort((a, b) => b - a)).toEqual(p);
  });

  it("kcal → แคลอรี่น้อยไปมาก", () => {
    const sorted = sortRecipes(recipes, "kcal");
    const k = sorted.map((r) => recipeMacros(r).kcal);
    expect([...k].sort((a, b) => a - b)).toEqual(k);
  });

  it("default → ลำดับเดิม ไม่แก้ array ต้นทาง", () => {
    const before = recipes.map((r) => r.id);
    sortRecipes(recipes, "protein");
    expect(recipes.map((r) => r.id)).toEqual(before);
    expect(sortRecipes(recipes, "default").map((r) => r.id)).toEqual(before);
  });
});

describe("recipeUsage", () => {
  it("แผนเริ่มต้น: ln-chicken ใช้ทุกวัน (7) · po-whey-rice ใช้ จ/พ/ศ", () => {
    const usage = recipeUsage(week, {});
    expect(usage.get("ln-chicken")?.length).toBe(7);
    expect(usage.get("po-whey-rice")?.map((u) => u.day)).toEqual([
      "mon",
      "wed",
      "fri",
    ]);
  });

  it("สลับเที่ยงอังคารเป็นหมู → ln-chicken เหลือ 6 และ ln-pork ขึ้นอังคาร", () => {
    const usage = recipeUsage(week, { "tue:1": "ln-pork" });
    expect(usage.get("ln-chicken")?.length).toBe(6);
    expect(usage.get("ln-pork")?.map((u) => u.day)).toEqual(["tue"]);
  });
});

describe("slotOptions", () => {
  it("มื้อกลางวันมีให้เลือกครบ 7 วัน พร้อมเมนูปัจจุบัน", () => {
    const opts = slotOptions(week, {}, "lunch");
    expect(opts).toHaveLength(7);
    expect(opts.every((o) => o.currentRecipeId === "ln-chicken")).toBe(true);
  });

  it("ของหวานไม่มีช่องในแผน → ว่าง", () => {
    expect(slotOptions(week, {}, "dessert")).toHaveLength(0);
  });
});

describe("recipes — ความครบของข้อมูลการ์ด", () => {
  it("ทุกเมนูมีอีโมจิ", () => {
    const missing = recipes.filter((r) => !r.emoji).map((r) => r.id);
    expect(missing).toEqual([]);
  });
});
