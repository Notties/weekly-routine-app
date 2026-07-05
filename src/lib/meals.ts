import { recipes } from "@/data/recipes";
import { MEAL_SLOT_LABEL } from "@/data/types";
import type {
  Day,
  DayMeal,
  Meal,
  MealSlot,
  Recipe,
  ResolvedDay,
} from "@/data/types";
import { recipeMacros } from "./nutrition";

const ZERO_MACROS = { kcal: 0, protein: 0, carb: 0, fat: 0 } as const;

const recipeById = new Map(recipes.map((r) => [r.id, r] as const));

export function getRecipe(id: string): Recipe | undefined {
  return recipeById.get(id);
}

/** เมนูทั้งหมดในหมวดเดียวกัน (ใช้เป็นตัวเลือกตอนสลับ) */
export function recipesForSlot(slot: MealSlot): Recipe[] {
  return recipes.filter((r) => r.slot === slot);
}

/** คีย์สำหรับจำการสลับเมนู (รายวันรายมื้อ) */
export function swapKey(dayKey: string, index: number): string {
  return `${dayKey}:${index}`;
}

/** หา recipeId ที่ใช้จริง (ถ้ามีการสลับและ id ถูกต้อง ใช้ตัวที่สลับ) */
export function resolveRecipeId(
  dayKey: string,
  index: number,
  dm: DayMeal,
  swaps: Record<string, string>
): string {
  const chosen = swaps[swapKey(dayKey, index)];
  return chosen && recipeById.has(chosen) ? chosen : dm.recipeId;
}

/** แปลง DayMeal → Meal พร้อมแสดงผล (ดึงข้อมูลจากเมนูที่เลือก) */
export function resolveMeal(
  dayKey: string,
  index: number,
  dm: DayMeal,
  swaps: Record<string, string>
): Meal {
  const id = resolveRecipeId(dayKey, index, dm, swaps);
  const recipe = recipeById.get(id);
  return {
    time: dm.time,
    name: MEAL_SLOT_LABEL[dm.slot],
    menu: recipe?.name ?? "(ไม่พบเมนู)",
    recipeId: recipe?.id ?? dm.recipeId,
    slot: dm.slot,
    equipment: recipe?.equipment,
    ingredients: recipe?.ingredients ?? [],
    steps: recipe?.steps ?? [],
    tags: dm.tags ?? recipe?.tags ?? [],
    macros: recipe ? recipeMacros(recipe) : { ...ZERO_MACROS },
    benefit: recipe?.benefit ?? "",
  };
}

/** วันที่ resolve เมนูครบทุกมื้อแล้ว (ใช้ส่งให้ทุก view) */
export function resolveDay(
  day: Day,
  swaps: Record<string, string>
): ResolvedDay {
  return {
    ...day,
    meals: day.meals.map((dm, i) => resolveMeal(day.key, i, dm, swaps)),
  };
}

/** id ของเมนูที่ใช้จริงทั้งสัปดาห์ (ตามค่าเริ่มต้น + การสลับ) */
export function activeRecipeIds(
  week: Day[],
  swaps: Record<string, string>
): string[] {
  const ids: string[] = [];
  for (const day of week) {
    day.meals.forEach((dm, i) => {
      ids.push(resolveRecipeId(day.key, i, dm, swaps));
    });
  }
  return ids;
}
