import type { Recipe } from "@/data/types";

export type RecipeFilter = {
  id: string;
  label: string;
  match: (r: Recipe) => boolean;
};

export const RECIPE_FILTERS: RecipeFilter[] = [
  { id: "heart", label: "ดีต่อหัวใจ", match: (r) => !!r.tags?.includes("ดีต่อหัวใจ") },
  { id: "protein", label: "โปรตีนสูง", match: (r) => !!r.tags?.includes("โปรตีนสูง") },
  { id: "fast", label: "ทำเร็ว", match: (r) => !!r.tags?.includes("ทำเร็ว") },
  { id: "nomeat", label: "ไม่มีเนื้อสัตว์", match: (r) => !!r.tags?.includes("ไม่มีเนื้อสัตว์") },
  { id: "pre", label: "ก่อนเล่น", match: (r) => r.slot === "preworkout" || !!r.tags?.includes("ก่อนเล่น") },
  { id: "post", label: "หลังเล่น", match: (r) => r.slot === "postworkout" },
  { id: "dessert", label: "ของหวาน", match: (r) => r.slot === "dessert" },
  { id: "nopan", label: "ไม่ต้องใช้กระทะ", match: (r) => !r.equipment.includes("กระทะไฟฟ้า") },
];

const BY_ID = new Map(RECIPE_FILTERS.map((f) => [f.id, f] as const));

/** filterId = null หรือไม่รู้จัก → คืนทั้งหมด */
export function filterRecipes(recipes: Recipe[], filterId: string | null): Recipe[] {
  if (!filterId) return recipes;
  const f = BY_ID.get(filterId);
  if (!f) return recipes;
  return recipes.filter(f.match);
}
