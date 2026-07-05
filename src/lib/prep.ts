import { ingredientCatalog, pantryStaples } from "@/data/ingredients";
import type {
  CatalogItem,
  Day,
  DayKey,
  StorageZone,
} from "@/data/types";
import { getRecipe, resolveRecipeId } from "./meals";

// แผนที่ชื่อวัตถุดิบ → รายการใน catalog (รวมของครัวพื้นฐาน)
const catalogByName = new Map<string, CatalogItem>(
  [...ingredientCatalog, ...pantryStaples].map((c) => [c.name, c] as const)
);

/** กรัมที่ใช้จริงต่อวัตถุดิบ รวมทั้งสัปดาห์ (ตามเมนูเริ่มต้น + การสลับ) */
export function weeklyIngredientGrams(
  week: Day[],
  swaps: Record<string, string>
): { name: string; grams: number }[] {
  const totals = new Map<string, number>();
  for (const day of week) {
    day.meals.forEach((dm, i) => {
      const recipe = getRecipe(resolveRecipeId(day.key, i, dm, swaps));
      recipe?.ingredients.forEach((ing) => {
        totals.set(ing.name, (totals.get(ing.name) ?? 0) + ing.grams);
      });
    });
  }
  return [...totals.entries()]
    .map(([name, grams]) => ({ name, grams }))
    .sort((a, b) => b.grams - a.grams);
}

/** วัตถุดิบนี้เป็น "เนื้อสดแบ่งถุงแช่แข็ง" ไหม (โปรตีนที่เก็บช่องแข็ง เช่น อกไก่/หมู) */
function isBagMeat(name: string): boolean {
  const item = catalogByName.get(name);
  return item?.category === "โปรตีน" && item.storage.zone === "freezer";
}

/** ถุงเนื้อของ 1 วัน: รวมกรัมเนื้อสดที่วันนั้นใช้จริง */
export type MeatBag = {
  day: DayKey;
  /** ชื่อวันเต็ม เช่น "จันทร์" */
  label: string;
  /** ชื่อย่อ เช่น "จ" */
  short: string;
  /** เนื้อแต่ละชนิดในถุง (ปกติมีชนิดเดียว แต่สลับเมนูแล้วอาจผสม) */
  items: { name: string; grams: number }[];
  /** กรัมรวมของถุง */
  total: number;
};

/**
 * แบ่งเนื้อสดเป็นถุงรายวัน (ชั่งครั้งเดียววันซื้อของ แล้วทั้งสัปดาห์ไม่ต้องชั่งเนื้ออีก)
 * ถุง = ผลรวมกรัมเนื้อของทุกมื้อในวันนั้น ตามเมนูที่ใช้จริง — สลับเมนูแล้วเลขอัปเดตเอง
 */
export function meatBags(
  week: Day[],
  swaps: Record<string, string>
): MeatBag[] {
  return week.map((day) => {
    const grams = new Map<string, number>();
    day.meals.forEach((dm, i) => {
      const recipe = getRecipe(resolveRecipeId(day.key, i, dm, swaps));
      recipe?.ingredients.forEach((ing) => {
        if (isBagMeat(ing.name)) {
          grams.set(ing.name, (grams.get(ing.name) ?? 0) + ing.grams);
        }
      });
    });
    const items = [...grams.entries()].map(([name, g]) => ({
      name,
      grams: g,
    }));
    return {
      day: day.key,
      label: day.label,
      short: day.short,
      items,
      total: items.reduce((s, it) => s + it.grams, 0),
    };
  });
}

/** จัดกลุ่มวัตถุดิบ (เฉพาะที่ใช้จริง) ตามโซนเก็บ — เรียง fridge → freezer → pantry */
export function groupByStorageZone(
  names: Iterable<string>
): Record<StorageZone, CatalogItem[]> {
  const zones: Record<StorageZone, CatalogItem[]> = {
    fridge: [],
    freezer: [],
    pantry: [],
  };
  for (const name of names) {
    const item = catalogByName.get(name);
    if (item) zones[item.storage.zone].push(item);
  }
  return zones;
}
