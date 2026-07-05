"use client";

import * as React from "react";
import { Info, Sparkles, Check } from "lucide-react";
import { recipes, week } from "@/data";
import { MEAL_SLOT_LABEL, type MealSlot, type Recipe } from "@/data/types";
import { recipeMacros } from "@/lib/nutrition";
import { portionLabel } from "@/lib/portion";
import { RECIPE_FILTERS, filterRecipes } from "@/lib/recipe-filter";
import {
  searchRecipes,
  sortRecipes,
  recipeUsage,
  slotOptions,
  RECIPE_SORT_LABEL,
  type MealSlotRef,
  type RecipeSort,
} from "@/lib/recipe-browse";
import { swapKey } from "@/lib/meals";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { SectionTitle, StepList, TagRow } from "@/components/blocks";
import { EquipmentBadges } from "@/components/equipment-badges";
import { NutritionStrip } from "@/components/nutrition-strip";
import { Button } from "@/components/ui/button";
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

const SORT_CHOICES: RecipeSort[] = ["protein", "kcal"];

function RecipeCard({
  recipe,
  usage,
  options,
  expanded,
  onToggle,
  onUse,
}: {
  recipe: Recipe;
  /** ช่องมื้อที่เมนูนี้ถูกใช้อยู่ในสัปดาห์ */
  usage: MealSlotRef[];
  /** ช่องมื้อทั้งหมดใน slot เดียวกัน (ตัวเลือกปุ่ม "ใช้") */
  options: MealSlotRef[];
  expanded: boolean;
  onToggle: () => void;
  onUse: (ref: MealSlotRef) => void;
}) {
  const macros = recipeMacros(recipe);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* หัวการ์ด (ย่อ) — แตะเพื่อกาง/พับ */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold">
            <span aria-hidden="true">{recipe.emoji}</span> {recipe.name}
          </h3>
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 shrink-0 text-xs text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          >
            ▼
          </span>
        </div>
        <p className="tnum mt-1 text-xs text-muted-foreground">
          {macros.kcal} kcal · โปรตีน {macros.protein} ก. · คาร์บ {macros.carb}{" "}
          ก. · ไขมัน {macros.fat} ก.
        </p>
        {usage.length > 0 && (
          <p className="mt-1 text-xs font-semibold text-primary">
            ในแผน: {usage.map((u) => u.dayShort).join(" · ")}
          </p>
        )}
      </button>

      {/* รายละเอียด (กางแล้ว) */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          <EquipmentBadges equipment={recipe.equipment} />
          <NutritionStrip macros={macros} />

          {/* วัตถุดิบ + หน่วยบ้าน ๆ */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recipe.ingredients.map((ing) => (
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

          {recipe.benefit && (
            <p className="mt-2 flex gap-1.5 text-xs leading-snug text-muted-foreground">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{recipe.benefit}</span>
            </p>
          )}
          <StepList steps={recipe.steps} />
          {recipe.tags && <TagRow tags={recipe.tags} />}

          {/* ใช้เมนูนี้ในแผน */}
          <div className="mt-3 rounded-xl border border-border bg-muted/40 p-2">
            <p className="px-1 pb-1 text-xs font-semibold text-muted-foreground">
              ใช้เมนูนี้ในแผน ({MEAL_SLOT_LABEL[recipe.slot]})
            </p>
            {options.length === 0 && (
              <p className="px-1 pb-1 text-xs text-muted-foreground">
                แผนสัปดาห์นี้ไม่มีช่อง{MEAL_SLOT_LABEL[recipe.slot]} —
                สลับจากแท็บอาหารไม่ได้ แต่ทำกินเพิ่มได้ตามสะดวก
              </p>
            )}
            {options.map((o) => {
              const active = o.currentRecipeId === recipe.id;
              return (
                <div
                  key={`${o.day}:${o.index}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5"
                >
                  <span className="text-sm">
                    {o.dayLabel}{" "}
                    <span className="tnum text-xs text-muted-foreground">
                      {o.time}
                    </span>
                  </span>
                  {active ? (
                    <span className="flex items-center gap-1 px-2 text-xs font-semibold text-primary">
                      <Check className="size-3.5" />
                      ใช้อยู่
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={() => onUse(o)}
                    >
                      ใช้
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
  const swaps = useAppStore((s) => s.swaps);
  const setSwap = useAppStore((s) => s.setSwap);

  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<RecipeSort>("default");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  // เมนูไหนถูกใช้วันไหนบ้าง + ช่องมื้อทั้งหมดต่อ slot (อัปเดตตามการสลับ)
  const usage = React.useMemo(() => recipeUsage(week, swaps), [swaps]);
  const optionsBySlot = React.useMemo(() => {
    const map = new Map<MealSlot, MealSlotRef[]>();
    for (const slot of SLOT_ORDER) map.set(slot, slotOptions(week, swaps, slot));
    return map;
  }, [swaps]);

  const filtered = searchRecipes(filterRecipes(recipes, activeFilter), query);

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const applyRecipe = (recipe: Recipe, ref: MealSlotRef) => {
    setSwap(swapKey(ref.day, ref.index), recipe.id);
    toast.success(
      `เปลี่ยน${ref.slotLabel}วัน${ref.dayLabel}เป็น "${recipe.name}" แล้ว`
    );
  };

  const jumpTo = (slot: MealSlot) => {
    document
      .getElementById(`slot-${slot}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const visibleSlots = SLOT_ORDER.filter((slot) =>
    filtered.some((r) => r.slot === slot)
  );

  return (
    <div className="space-y-5 px-4 py-4">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
        <Info className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm leading-snug">
          คลังเมนูทั้งหมด — แตะการ์ดเพื่อดูวัตถุดิบ/วิธีทำ แล้วกด
          &quot;ใช้&quot; เพื่อวางเมนูลงแผนได้เลย รายการซื้อของจะอัปเดตให้เอง
        </p>
      </div>

      {/* ค้นหา */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหาเมนูหรือวัตถุดิบ เช่น ไข่, โอ๊ต, อกไก่…"
        aria-label="ค้นหาเมนูหรือวัตถุดิบ"
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      />

      {/* ฟิลเตอร์ */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip
          label="ทั้งหมด"
          active={activeFilter === null}
          onClick={() => setActiveFilter(null)}
        />
        {RECIPE_FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            active={activeFilter === f.id}
            onClick={() =>
              setActiveFilter(activeFilter === f.id ? null : f.id)
            }
          />
        ))}
      </div>

      {/* เรียงลำดับ */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">เรียง:</span>
        {SORT_CHOICES.map((s) => (
          <FilterChip
            key={s}
            label={RECIPE_SORT_LABEL[s]}
            active={sort === s}
            onClick={() => setSort(sort === s ? "default" : s)}
          />
        ))}
      </div>

      {/* กระโดดไปหมวด */}
      {visibleSlots.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {visibleSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => jumpTo(slot)}
              className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              {MEAL_SLOT_LABEL[slot]} ↓
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          ไม่พบเมนูที่ตรงกับ &quot;{query}&quot;
        </p>
      )}

      {SLOT_ORDER.map((slot) => {
        const items = sortRecipes(
          filtered.filter((r) => r.slot === slot),
          sort
        );
        if (items.length === 0) return null;
        return (
          <section key={slot} id={`slot-${slot}`} className="scroll-mt-44">
            <SectionTitle>
              {MEAL_SLOT_LABEL[slot]} ({items.length})
            </SectionTitle>
            <div className="mt-2 space-y-3">
              {items.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  usage={usage.get(r.id) ?? []}
                  options={optionsBySlot.get(r.slot) ?? []}
                  expanded={expanded.has(r.id)}
                  onToggle={() => toggleExpanded(r.id)}
                  onUse={(ref) => applyRecipe(r, ref)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
