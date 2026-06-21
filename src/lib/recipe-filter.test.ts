import { describe, it, expect } from "bun:test";
import { recipes } from "@/data/recipes";
import { ingredientCatalog, pantryStaples } from "@/data/ingredients";
import { filterRecipes } from "./recipe-filter";

describe("filterRecipes", () => {
  it("null → คืนทั้งหมด", () => {
    expect(filterRecipes(recipes, null).length).toBe(recipes.length);
  });
  it("dessert → เฉพาะของหวาน 5 เมนู", () => {
    const d = filterRecipes(recipes, "dessert");
    expect(d.length).toBe(5);
    expect(d.every((r) => r.slot === "dessert")).toBe(true);
  });
  it("nopan → ไม่มีเมนูที่ใช้กระทะไฟฟ้า", () => {
    const r = filterRecipes(recipes, "nopan");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => !x.equipment.includes("กระทะไฟฟ้า"))).toBe(true);
  });
  it("nomeat → ทุกเมนูมีแท็ก ไม่มีเนื้อสัตว์", () => {
    const r = filterRecipes(recipes, "nomeat");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.tags?.includes("ไม่มีเนื้อสัตว์"))).toBe(true);
  });
  it("id ที่ไม่รู้จัก → คืนทั้งหมด", () => {
    expect(filterRecipes(recipes, "zzz").length).toBe(recipes.length);
  });
});

describe("referential integrity", () => {
  const known = new Set(
    [...ingredientCatalog, ...pantryStaples].map((c) => c.name)
  );
  it("ทุกวัตถุดิบในเมนูมีใน catalog/pantry", () => {
    const missing: string[] = [];
    for (const r of recipes)
      for (const ing of r.ingredients)
        if (!known.has(ing.name)) missing.push(`${r.id}:${ing.name}`);
    expect(missing).toEqual([]);
  });
});
