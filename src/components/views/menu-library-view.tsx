import { Info } from "lucide-react";
import { recipes } from "@/data";
import { MEAL_SLOT_LABEL, type MealSlot, type Recipe } from "@/data/types";
import { SectionTitle, StepList, TagRow } from "@/components/blocks";
import { EquipmentBadges } from "@/components/equipment-badges";

const SLOT_ORDER: MealSlot[] = [
  "breakfast",
  "preworkout",
  "lunch",
  "snack",
  "postworkout",
  "dinner",
];

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-bold">{recipe.name}</h3>
      <EquipmentBadges equipment={recipe.equipment} />
      <p className="mt-2 text-sm">
        <span className="text-xs font-semibold text-muted-foreground">
          วัตถุดิบ:{" "}
        </span>
        {recipe.ingredients.join(" · ")}
      </p>
      <StepList steps={recipe.steps} />
      {recipe.tags && <TagRow tags={recipe.tags} />}
    </article>
  );
}

export function MenuLibraryView() {
  return (
    <div className="space-y-6 px-4 py-4">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
        <Info className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm leading-snug">
          คลังเมนูทั้งหมด พร้อมวัตถุดิบและวิธีทำ — กด “สลับ” ในแท็บ 🍱 อาหาร
          เพื่อเปลี่ยนเมนูของแต่ละมื้อ แล้วรายการซื้อของจะอัปเดตวัตถุดิบให้เอง
        </p>
      </div>

      {SLOT_ORDER.map((slot) => {
        const items = recipes.filter((r) => r.slot === slot);
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
