import { MEAL_SLOT_LABEL } from "@/data/types";
import type { Day, DayKey, MealSlot, Recipe } from "@/data/types";
import { recipeMacros } from "./nutrition";
import { resolveRecipeId } from "./meals";

// ───────────────────────────────────────────────────────────
// เครื่องมือเรียกดูคลังเมนู: ค้นหา / เรียงลำดับ / เช็คว่าใช้อยู่ในแผนวันไหน
// ───────────────────────────────────────────────────────────

/** ค้นหาเมนูจากชื่อหรือชื่อวัตถุดิบ (เว้นว่าง = ทั้งหมด) */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = query.trim();
  if (!q) return recipes;
  return recipes.filter(
    (r) =>
      r.name.includes(q) || r.ingredients.some((i) => i.name.includes(q))
  );
}

export type RecipeSort = "default" | "protein" | "kcal";

export const RECIPE_SORT_LABEL: Record<RecipeSort, string> = {
  default: "ปกติ",
  protein: "โปรตีนมากก่อน",
  kcal: "แคลน้อยก่อน",
};

/** เรียงเมนู: protein = โปรตีนมาก→น้อย · kcal = แคลอรี่น้อย→มาก · default = ตามลำดับเดิม */
export function sortRecipes(recipes: Recipe[], sort: RecipeSort): Recipe[] {
  if (sort === "default") return recipes;
  const sorted = [...recipes];
  if (sort === "protein") {
    sorted.sort((a, b) => recipeMacros(b).protein - recipeMacros(a).protein);
  } else {
    sorted.sort((a, b) => recipeMacros(a).kcal - recipeMacros(b).kcal);
  }
  return sorted;
}

/** จุดในแผนสัปดาห์ที่เมนูหนึ่งถูกใช้ (หรือใช้แทนได้ ถ้า slot ตรงกัน) */
export type MealSlotRef = {
  day: DayKey;
  /** ชื่อวันเต็ม เช่น "จันทร์" */
  dayLabel: string;
  /** ชื่อย่อ เช่น "จ" */
  dayShort: string;
  /** index มื้อในวันนั้น (ใช้ทำ swapKey) */
  index: number;
  /** เวลามื้อ "HH:MM" */
  time: string;
  slot: MealSlot;
  /** ป้ายมื้อ เช่น "มื้อเช้า" */
  slotLabel: string;
  /** recipeId ที่ช่องนี้ใช้อยู่ตอนนี้ */
  currentRecipeId: string;
};

/** ทุกช่องมื้อในสัปดาห์ที่ slot ตรงกับเมนูนี้ (ไว้ทำปุ่ม "ใช้เมนูนี้") */
export function slotOptions(
  week: Day[],
  swaps: Record<string, string>,
  slot: MealSlot
): MealSlotRef[] {
  const refs: MealSlotRef[] = [];
  for (const day of week) {
    day.meals.forEach((dm, i) => {
      if (dm.slot !== slot) return;
      refs.push({
        day: day.key,
        dayLabel: day.label,
        dayShort: day.short,
        index: i,
        time: dm.time,
        slot: dm.slot,
        slotLabel: MEAL_SLOT_LABEL[dm.slot],
        currentRecipeId: resolveRecipeId(day.key, i, dm, swaps),
      });
    });
  }
  return refs;
}

/** แผนที่ recipeId → ช่องมื้อที่เมนูนั้นถูกใช้อยู่จริงในสัปดาห์นี้ */
export function recipeUsage(
  week: Day[],
  swaps: Record<string, string>
): Map<string, MealSlotRef[]> {
  const usage = new Map<string, MealSlotRef[]>();
  for (const day of week) {
    day.meals.forEach((dm, i) => {
      const id = resolveRecipeId(day.key, i, dm, swaps);
      const list = usage.get(id) ?? [];
      list.push({
        day: day.key,
        dayLabel: day.label,
        dayShort: day.short,
        index: i,
        time: dm.time,
        slot: dm.slot,
        slotLabel: MEAL_SLOT_LABEL[dm.slot],
        currentRecipeId: id,
      });
      usage.set(id, list);
    });
  }
  return usage;
}
