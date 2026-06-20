import type { Meal } from "@/data/types";
import { StepList, TagRow } from "@/components/blocks";
import { EquipmentBadges } from "@/components/equipment-badges";

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">{meal.name}</h3>
        <time className="tnum text-xs font-medium text-muted-foreground">
          {meal.time}
        </time>
      </div>
      <p className="mt-1 text-sm">{meal.menu}</p>
      <EquipmentBadges equipment={meal.equipment} />
      <StepList steps={meal.steps} />
      <TagRow tags={meal.tags} />
    </article>
  );
}
