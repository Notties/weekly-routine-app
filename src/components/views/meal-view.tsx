import { Droplets } from "lucide-react";
import type { ResolvedDay } from "@/data/types";
import { waterTip, water, profile } from "@/data";
import { bottlesPerDay } from "@/lib/cost";
import { sumMacros, dailyTarget } from "@/lib/nutrition";
import { MealCard } from "@/components/meal-card";
import { toMinutes } from "@/lib/timeline";
import { DailyNutritionSummary } from "@/components/daily-nutrition-summary";

export function MealView({
  day,
  onSwap,
}: {
  day: ResolvedDay;
  onSwap: (mealIndex: number, recipeId: string) => void;
}) {
  // เรียงตามเวลา แต่คงดัชนีเดิมไว้ (ใช้สลับเมนูให้ตรงช่อง)
  const meals = day.meals
    .map((meal, index) => ({ meal, index }))
    .sort((a, b) => toMinutes(a.meal.time) - toMinutes(b.meal.time));

  const bpd = bottlesPerDay(water.litersPerDay, water.pack.literEach);
  const total = sumMacros(day.meals.map((m) => m.macros));
  const target = dailyTarget(profile, day.type);

  return (
    <div className="space-y-4 px-4 py-4">
      <DailyNutritionSummary total={total} target={target} />

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
        <Droplets className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold tnum">
            ดื่มน้ำ ~{water.litersPerDay} ลิตร/วัน ≈ {bpd} ขวด (1.5L)
          </p>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {waterTip}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {meals.map(({ meal, index }) => (
          <MealCard
            key={index}
            meal={meal}
            onSwap={(recipeId) => onSwap(index, recipeId)}
          />
        ))}
      </div>
    </div>
  );
}
