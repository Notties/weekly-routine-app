import { Droplets } from "lucide-react";
import type { ResolvedDay } from "@/data/types";
import { waterTip } from "@/data";
import { MealCard } from "@/components/meal-card";
import { toMinutes } from "@/lib/timeline";

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

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
        <Droplets className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm leading-snug">{waterTip}</p>
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
