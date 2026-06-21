import type { Macros } from "@/data/types";

/** แถบมาโครเล็ก ๆ: kcal · P/C/F (กรัม) */
export function NutritionStrip({ macros }: { macros: Macros }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span className="tnum font-semibold text-foreground">{macros.kcal} kcal</span>
      <span className="text-border">·</span>
      <span className="tnum">P {macros.protein} ก.</span>
      <span className="tnum">C {macros.carb} ก.</span>
      <span className="tnum">F {macros.fat} ก.</span>
    </div>
  );
}
