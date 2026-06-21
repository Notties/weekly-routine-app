import { ingredientCatalog, pantryStaples } from "@/data/ingredients";
import type { DayType, Macros, Profile } from "@/data/types";

// แผนที่ชื่อวัตถุดิบ → มาโครต่อ 100 ก. (รวมทั้ง catalog + ของครัวพื้นฐาน)
const macroByName = new Map<string, Macros>(
  [...ingredientCatalog, ...pantryStaples].map(
    (c) => [c.name, c.macrosPer100g] as const
  )
);

const ZERO: Macros = { kcal: 0, protein: 0, carb: 0, fat: 0 };

/** มาโครของวัตถุดิบ 1 ชนิดตามกรัม (ไม่ปัดเศษ) — ชื่อไม่รู้จักคืน 0 */
export function macrosOf(name: string, grams: number): Macros {
  const per100 = macroByName.get(name);
  if (!per100) return { ...ZERO };
  const k = grams / 100;
  return {
    kcal: per100.kcal * k,
    protein: per100.protein * k,
    carb: per100.carb * k,
    fat: per100.fat * k,
  };
}

/** รวมมาโครหลายก้อน */
export function sumMacros(list: Macros[]): Macros {
  return list.reduce<Macros>(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      protein: a.protein + m.protein,
      carb: a.carb + m.carb,
      fat: a.fat + m.fat,
    }),
    { ...ZERO }
  );
}

// ── เป้าหมายต่อวัน ──
const ACTIVITY: Record<DayType, number> = { weights: 1.5, cardio: 1.45, rest: 1.3 };
const DEFICIT: Record<DayType, number> = { weights: 310, cardio: 380, rest: 325 };
const PROTEIN_PER_KG = 2.0; // รักษากล้ามระหว่างลดไขมัน
const FAT_PER_KG = 0.8;

/** BMR (Mifflin-St Jeor) */
function bmr(p: Profile): number {
  const sexConst = p.sex === "ชาย" ? 5 : -161;
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + sexConst;
}

/** เป้ามาโครต่อวันตามชนิดวัน — kcal ปัดเป็นพหุคูณของ 10 */
export function dailyTarget(p: Profile, type: DayType): Macros {
  const tdee = bmr(p) * ACTIVITY[type];
  const kcal = Math.round((tdee - DEFICIT[type]) / 10) * 10;
  const protein = Math.round(p.weightKg * PROTEIN_PER_KG);
  const fat = Math.round(p.weightKg * FAT_PER_KG);
  const carb = Math.round((kcal - protein * 4 - fat * 9) / 4);
  return { kcal, protein, carb, fat };
}
