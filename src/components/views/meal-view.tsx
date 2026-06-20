import { Droplets } from "lucide-react";
import type { Day } from "@/data/types";
import { waterTip } from "@/data";
import { MealCard } from "@/components/meal-card";
import { toMinutes } from "@/lib/timeline";

export function MealView({ day }: { day: Day }) {
  const meals = [...day.meals].sort(
    (a, b) => toMinutes(a.time) - toMinutes(b.time)
  );

  return (
    <div className="space-y-4 px-4 py-4">
      {/* เตือนดื่มน้ำ */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
        <Droplets className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm leading-snug">{waterTip}</p>
      </div>

      {/* มื้อทั้งหมด */}
      <div className="space-y-3">
        {meals.map((meal, i) => (
          <MealCard key={i} meal={meal} />
        ))}
      </div>
    </div>
  );
}
