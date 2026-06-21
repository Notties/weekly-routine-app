"use client";

import * as React from "react";
import { Info, Sparkles } from "lucide-react";
import { recipes } from "@/data";
import { MEAL_SLOT_LABEL, type MealSlot, type Recipe } from "@/data/types";
import { recipeMacros } from "@/lib/nutrition";
import { RECIPE_FILTERS, filterRecipes } from "@/lib/recipe-filter";
import { SectionTitle, StepList, TagRow } from "@/components/blocks";
import { EquipmentBadges } from "@/components/equipment-badges";
import { NutritionStrip } from "@/components/nutrition-strip";
import { cn } from "@/lib/utils";

const SLOT_ORDER: MealSlot[] = [
  "breakfast",
  "preworkout",
  "lunch",
  "snack",
  "postworkout",
  "dinner",
  "dessert",
];

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-bold">{recipe.name}</h3>
      <EquipmentBadges equipment={recipe.equipment} />
      <NutritionStrip macros={recipeMacros(recipe)} />
      <p className="mt-2 text-sm">
        <span className="text-xs font-semibold text-muted-foreground">
          วัตถุดิบ:{" "}
        </span>
        {recipe.ingredients.map((i) => `${i.name} ${i.grams} ก.`).join(" · ")}
      </p>
      {recipe.benefit && (
        <p className="mt-2 flex gap-1.5 text-xs leading-snug text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{recipe.benefit}</span>
        </p>
      )}
      <StepList steps={recipe.steps} />
      {recipe.tags && <TagRow tags={recipe.tags} />}
    </article>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted text-foreground hover:bg-muted/70"
      )}
    >
      {label}
    </button>
  );
}

export function MenuLibraryView() {
  const [active, setActive] = React.useState<string | null>(null);
  const filtered = filterRecipes(recipes, active);

  return (
    <div className="space-y-6 px-4 py-4">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
        <Info className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm leading-snug">
          คลังเมนูทั้งหมด พร้อมวัตถุดิบและวิธีทำ — กด &quot;สลับ&quot; ในแท็บ 🍱 อาหาร
          เพื่อเปลี่ยนเมนูของแต่ละมื้อ แล้วรายการซื้อของจะอัปเดตวัตถุดิบให้เอง
        </p>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip
          label="ทั้งหมด"
          active={active === null}
          onClick={() => setActive(null)}
        />
        {RECIPE_FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            active={active === f.id}
            onClick={() => setActive(active === f.id ? null : f.id)}
          />
        ))}
      </div>

      {SLOT_ORDER.map((slot) => {
        const items = filtered.filter((r) => r.slot === slot);
        if (items.length === 0) return null;
        return (
          <section key={slot}>
            <SectionTitle>
              {MEAL_SLOT_LABEL[slot]} ({items.length})
            </SectionTitle>
            <div className="mt-2 space-y-3">
              {items.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
