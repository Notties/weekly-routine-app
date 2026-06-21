import { Droplets, Minus, Plus } from "lucide-react";
import type { Profile, ResolvedDay, DayLog } from "@/data/types";
import { waterTip, water } from "@/data";
import { bottlesPerDay } from "@/lib/cost";
import { sumMacros, dailyTarget } from "@/lib/nutrition";
import { MealCard } from "@/components/meal-card";
import { toMinutes } from "@/lib/timeline";
import { DailyNutritionSummary } from "@/components/daily-nutrition-summary";
import { Button } from "@/components/ui/button";
import { ExtraFoodCard } from "@/components/extra-food-card";

export function MealView({
  day,
  profile,
  onSwap,
  dateLog,
  isToday,
  onToggleMeal,
  onAddWater,
  onAddExtra,
  onClearExtra,
}: {
  day: ResolvedDay;
  profile: Profile;
  onSwap: (mealIndex: number, recipeId: string) => void;
  dateLog?: DayLog;
  isToday: boolean;
  onToggleMeal: (index: number) => void;
  onAddWater: (deltaMl: number) => void;
  onAddExtra: (kcal: number, protein: number) => void;
  onClearExtra: () => void;
}) {
  // เรียงตามเวลา แต่คงดัชนีเดิมไว้ (ใช้สลับเมนูให้ตรงช่อง)
  const meals = day.meals
    .map((meal, index) => ({ meal, index }))
    .sort((a, b) => toMinutes(a.meal.time) - toMinutes(b.meal.time));

  const bpd = bottlesPerDay(water.litersPerDay, water.pack.literEach);
  const planTotal = sumMacros(day.meals.map((m) => m.macros));
  const total = {
    kcal: planTotal.kcal + (dateLog?.extra?.kcal ?? 0),
    protein: planTotal.protein + (dateLog?.extra?.protein ?? 0),
    carb: planTotal.carb,
    fat: planTotal.fat,
  };
  const target = dailyTarget(profile, day.type);

  return (
    <div className="space-y-4 px-4 py-4">
      <DailyNutritionSummary total={total} target={target} />
      {isToday && (
        <ExtraFoodCard
          extra={dateLog?.extra}
          onAdd={onAddExtra}
          onClear={onClearExtra}
        />
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
        <Droplets className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold tnum">
            ดื่มน้ำ ~{water.litersPerDay} ลิตร/วัน ≈ {bpd} ขวด (1.5L)
          </p>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {waterTip}
          </p>
          {isToday && (
            <div className="mt-2 flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => onAddWater(-1500)}
                aria-label="ลดน้ำ 1 ขวด"
              >
                <Minus className="size-4" />
              </Button>
              <span className="tnum text-sm font-semibold">
                {((dateLog?.waterMl ?? 0) / 1000).toFixed(1)} /{" "}
                {water.litersPerDay} ล.
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => onAddWater(1500)}
                aria-label="เพิ่มน้ำ 1 ขวด"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {meals.map(({ meal, index }) => (
          <MealCard
            key={index}
            meal={meal}
            onSwap={(recipeId) => onSwap(index, recipeId)}
            showDone={isToday}
            done={!!dateLog?.meals?.[index]}
            onToggleDone={() => onToggleMeal(index)}
          />
        ))}
      </div>
    </div>
  );
}
