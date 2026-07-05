"use client";

import * as React from "react";
import { Repeat, Check, Sparkles } from "lucide-react";
import type { Meal } from "@/data/types";
import { recipesForSlot } from "@/lib/meals";
import { portionLabel } from "@/lib/portion";
import { StepList, TagRow } from "@/components/blocks";
import { EquipmentBadges } from "@/components/equipment-badges";
import { NutritionStrip } from "@/components/nutrition-strip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function MealCard({
  meal,
  onSwap,
  done = false,
  onToggleDone,
  showDone = false,
}: {
  meal: Meal;
  onSwap?: (recipeId: string) => void;
  done?: boolean;
  onToggleDone?: () => void;
  showDone?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const alternatives = onSwap ? recipesForSlot(meal.slot) : [];
  const canSwap = onSwap && alternatives.length > 1;

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">{meal.name}</h3>
        <time className="tnum text-xs font-medium text-muted-foreground">
          {meal.time}
        </time>
      </div>

      <div className="mt-1 flex items-start justify-between gap-2">
        <p className="text-sm">
          <span aria-hidden="true">{meal.emoji}</span> {meal.menu}
        </p>
        {canSwap && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((o) => !o)}
            className="-mr-2 -mt-1 h-7 shrink-0 gap-1 px-2 text-xs text-primary hover:text-primary"
          >
            <Repeat className="size-3.5" />
            สลับ
          </Button>
        )}
      </div>

      <EquipmentBadges equipment={meal.equipment} />
      <NutritionStrip macros={meal.macros} />

      {/* วัตถุดิบ + ปริมาณแบบหน่วยบ้าน ๆ (ฟอง/ลูก/แผ่น/สกู๊ป) ให้มือใหม่ชั่ง/นับตามได้ */}
      {meal.ingredients.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {meal.ingredients.map((ing) => (
            <span
              key={ing.name}
              className="tnum rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] text-foreground"
            >
              {ing.name}{" "}
              <span className="font-semibold">
                {portionLabel(ing.name, ing.grams)}
              </span>
            </span>
          ))}
        </div>
      )}

      {meal.benefit && (
        <p className="mt-2 flex gap-1.5 text-xs leading-snug text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{meal.benefit}</span>
        </p>
      )}
      <StepList steps={meal.steps} />
      <TagRow tags={meal.tags} />

      {showDone && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-border pt-3 text-sm">
          <Checkbox checked={done} onCheckedChange={() => onToggleDone?.()} />
          <span className={done ? "text-muted-foreground line-through" : ""}>
            กินแล้ว
          </span>
        </label>
      )}

      {canSwap && open && (
        <div className="mt-3 space-y-1 rounded-xl border border-border bg-muted/40 p-2">
          <p className="px-1 pb-1 text-xs text-muted-foreground">
            เลือกเมนู{meal.name}อื่น
          </p>
          {alternatives.map((r) => {
            const active = r.id === meal.recipeId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSwap?.(r.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {active ? (
                  <Check className="size-4 shrink-0" />
                ) : (
                  <span className="size-4 shrink-0" />
                )}
                <span aria-hidden="true">{r.emoji}</span>
                <span className="flex-1">{r.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}
