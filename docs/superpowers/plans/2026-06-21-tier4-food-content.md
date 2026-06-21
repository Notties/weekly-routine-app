# Tier 4A Food Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มของหวาน healthy (slot ใหม่ "dessert") + เมนูสลับใหม่ + ฟิลเตอร์ชิปในคลังเมนู โดยมาโครคำนวณอัตโนมัติเหมือนเดิม

**Architecture:** เพิ่มข้อมูลใน `recipes.ts`/`ingredients.ts`/`types.ts` (slot dessert + วัตถุดิบโกโก้/อบเชย) → ตรรกะกรองบริสุทธิ์ใน `lib/recipe-filter.ts` (เทสต์) → `menu-library-view.tsx` เป็น client เพิ่มแถบชิป + หมวดของหวาน

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript, Tailwind v4, lucide-react, `bun test`

## Global Constraints

- ทุกเมนูมือใหม่ทำได้ด้วย 4 อุปกรณ์ (+ "ไม่ต้องปรุง"); ใช้วัตถุดิบใน catalog เท่านั้น (วัตถุดิบใหม่ต้องเพิ่มใน `ingredients.ts` พร้อม `macrosPer100g`)
- ของหวาน slot `"dessert"` **ไม่อยู่ใน week.ts** → ไม่ swappable, ไม่เข้ารายการซื้อของอัตโนมัติ, ไม่กระทบ week balance test
- ฟิลเตอร์เลือกได้ **ทีละชิป** (`filterId: string | null`); ชิป dessert/post จับด้วย slot, ไม่พึ่งแท็ก
- ภาษาไทย, การ์ด `rounded-2xl border border-border bg-card p-4`, `tnum`, ไอคอน lucide
- Test: `bun test src/lib` · Type-check: `bun run build` (MEAL_SLOT_LABEL เป็น Record<MealSlot,string> → เพิ่ม key dessert ไม่งั้น build แดง)
- มาโครในสเปคเป็นค่าโดยประมาณ — ระบบคำนวณจาก grams × macrosPer100g

---

## File Structure

| ไฟล์ | ความรับผิดชอบ |
|---|---|
| `src/data/types.ts` | + `"dessert"` ใน `MealSlot` + `MEAL_SLOT_LABEL` |
| `src/data/ingredients.ts` | + ผงโกโก้, อบเชย |
| `src/data/recipes.ts` | + 5 ของหวาน + 4 เมนูสลับ |
| `src/lib/recipe-filter.ts` (ใหม่) | `RECIPE_FILTERS` + `filterRecipes` |
| `src/lib/recipe-filter.test.ts` (ใหม่) | เทสต์กรอง + referential integrity |
| `src/components/views/menu-library-view.tsx` | client + แถบชิป + หมวด dessert |

---

## Task 1: Data — dessert slot + ingredients + recipes

ข้อมูลล้วน ไม่ทำลายของเดิม (ของหวาน/เมนูใหม่ไม่อยู่ใน week.ts) เมนูสลับใหม่จะโผล่ในคลังทันที ของหวานจะโผล่หลัง Task 3 (เพิ่ม dessert ใน SLOT_ORDER)

**Files:**
- Modify: `src/data/types.ts`, `src/data/ingredients.ts`, `src/data/recipes.ts`

**Interfaces:**
- Produces: `MealSlot` มีค่า `"dessert"`; recipes id ใหม่: `dst-yogurt-bowl`, `dst-nicecream`, `dst-mugcake`, `dst-protein-mousse`, `dst-apple-cinnamon`, `bf-yogurt-oat`, `ln-eggrice`, `sn-boiled-egg`, `dn-eggveg`; ingredients ใหม่: `ผงโกโก้`, `อบเชย`

- [ ] **Step 1: เพิ่ม slot dessert ใน `src/data/types.ts`**

ใน `MealSlot` เพิ่ม `| "dessert"`:

```ts
export type MealSlot =
  | "breakfast"
  | "lunch"
  | "preworkout"
  | "postworkout"
  | "snack"
  | "dinner"
  | "dessert";
```

ใน `MEAL_SLOT_LABEL` เพิ่ม key:

```ts
export const MEAL_SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "มื้อเช้า",
  lunch: "มื้อกลางวัน",
  preworkout: "ก่อนเล่น",
  postworkout: "หลังเล่น",
  snack: "ของว่าง",
  dinner: "มื้อเย็น",
  dessert: "ของหวาน",
};
```

- [ ] **Step 2: เพิ่มวัตถุดิบใน `src/data/ingredients.ts`**

เพิ่ม 2 รายการนี้ใน `ingredientCatalog` (ก่อน `]` ปิด array ต่อจากกาแฟดำ):

```ts
  // ── ของหวาน/เบเกอรี่ ──
  { name: "ผงโกโก้", qty: "ผงโกโก้แท้ไม่ใส่น้ำตาล 1 กระปุก", price: 90, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 230, protein: 20, carb: 58, fat: 14 } },
  { name: "อบเชย", qty: "อบเชยป่น 1 ขวดเล็ก", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 247, protein: 4, carb: 81, fat: 1 } },
```

- [ ] **Step 3: เพิ่มเมนูใน `src/data/recipes.ts`**

เพิ่มบล็อกนี้ก่อน `]` ปิด array `recipes` (ต่อท้ายเมนูสุดท้าย `dn-chicken`):

```ts

  // ── เมนูสลับเพิ่ม (ความหลากหลาย) ──
  {
    id: "bf-yogurt-oat",
    name: "กรีกโยเกิร์ต + โอ๊ต + กล้วย + อัลมอนด์",
    slot: "breakfast",
    equipment: ["ไม่ต้องปรุง"],
    ingredients: [
      { name: "กรีกโยเกิร์ต", grams: 150 },
      { name: "ข้าวโอ๊ต", grams: 40 },
      { name: "กล้วยหอม", grams: 80 },
      { name: "อัลมอนด์", grams: 15 },
    ],
    steps: [
      "ใส่ข้าวโอ๊ต + กรีกโยเกิร์ตในถ้วย คนให้เข้ากัน (แช่ตู้เย็นข้ามคืนได้ = โอ๊ตนุ่ม)",
      "หั่นกล้วย + โรยอัลมอนด์ด้านบน",
    ],
    benefit:
      "มื้อเช้าโปรตีนสูง ทำเร็วไม่ต้องใช้ไฟ โอ๊ตให้ไฟเบอร์อิ่มนาน เหมาะวันรีบ",
    tags: ["โปรตีนสูง", "ทำเร็ว", "ไม่มีเนื้อสัตว์"],
  },
  {
    id: "ln-eggrice",
    name: "ข้าวกล้อง + ไข่ต้ม 3 ฟอง + ผัก (ไม่ใช้กระทะ)",
    slot: "lunch",
    equipment: ["หม้อหุงข้าว", "เครื่องต้มไข่", "ไมโครเวฟ"],
    ingredients: [
      { name: "ข้าวกล้อง", grams: 220 },
      { name: "ไข่ไก่", grams: 150 },
      { name: "ผักรวมแช่แข็ง", grams: 120 },
    ],
    steps: [
      "ต้มไข่ 3 ฟอง (เครื่องต้มไข่)",
      "ตักข้าวกล้อง อุ่นไมโครเวฟ 1–2 นาที",
      "อุ่นผักไมโครเวฟ 2 นาที กินคู่ไข่ต้ม",
    ],
    benefit:
      "มื้อกลางวันไม่ต้องใช้กระทะ ล้างน้อย ไข่ให้โปรตีนครบ + ข้าวกล้องเป็นพลังงาน",
    tags: ["ไม่มีเนื้อสัตว์"],
  },
  {
    id: "sn-boiled-egg",
    name: "ไข่ต้ม 2 ฟอง + แอปเปิล",
    slot: "snack",
    equipment: ["เครื่องต้มไข่"],
    ingredients: [
      { name: "ไข่ไก่", grams: 100 },
      { name: "แอปเปิล", grams: 150 },
    ],
    steps: ["ต้มไข่ 2 ฟอง", "กินคู่แอปเปิล 1 ลูก"],
    benefit:
      "ของว่างโปรตีนสูง อิ่มนาน พกง่าย เหมาะก่อนคาร์ดิโอหรือมื้อว่างบ่าย",
    tags: ["โปรตีนสูง", "ก่อนเล่น"],
  },
  {
    id: "dn-eggveg",
    name: "ไข่ต้ม 3 ฟอง + ผัก + แอปเปิล (เบาแป้ง)",
    slot: "dinner",
    equipment: ["เครื่องต้มไข่", "ไมโครเวฟ"],
    ingredients: [
      { name: "ไข่ไก่", grams: 150 },
      { name: "ผักรวมแช่แข็ง", grams: 120 },
      { name: "แอปเปิล", grams: 150 },
    ],
    steps: [
      "ต้มไข่ 3 ฟอง",
      "อุ่นผักไมโครเวฟ 2 นาที",
      "กินคู่แอปเปิล เบาแป้งก่อนนอน เน้นโปรตีน+ไฟเบอร์",
    ],
    benefit:
      "มื้อเย็นเบาแป้ง โปรตีนจากไข่ช่วยซ่อมกล้ามตอนนอน ผัก/ผลไม้ให้วิตามิน",
    tags: ["ไม่มีเนื้อสัตว์"],
  },

  // ── ของหวาน (healthy) ──
  {
    id: "dst-yogurt-bowl",
    name: "กรีกโยเกิร์ตโบว์ล + กล้วย + อัลมอนด์",
    slot: "dessert",
    equipment: ["ไม่ต้องปรุง"],
    ingredients: [
      { name: "กรีกโยเกิร์ต", grams: 150 },
      { name: "กล้วยหอม", grams: 80 },
      { name: "อัลมอนด์", grams: 15 },
    ],
    steps: ["ตักกรีกโยเกิร์ตใส่ถ้วย", "หั่นกล้วยวางด้านบน โรยอัลมอนด์สับ"],
    benefit:
      "ของหวานโปรตีนสูง ไขมันดีจากอัลมอนด์ ไม่มีน้ำตาลเพิ่ม กินหลังมื้อเย็นหรือของว่างบ่ายได้",
    tags: ["โปรตีนสูง", "ทำเร็ว", "ไม่มีเนื้อสัตว์"],
  },
  {
    id: "dst-nicecream",
    name: "ไอศกรีมกล้วยโกโก้",
    slot: "dessert",
    equipment: ["ไม่ต้องปรุง"],
    ingredients: [
      { name: "กล้วยหอม", grams: 150 },
      { name: "ผงโกโก้", grams: 5 },
      { name: "นมจืด", grams: 30 },
    ],
    steps: [
      "หั่นกล้วยเป็นแว่น แช่ช่องแข็ง ~2 ชม. จนแข็ง",
      "ใส่กล้วยแช่แข็ง + ผงโกโก้ + นม บดด้วยส้อมหรือปั่นจนเนียน",
      "กินทันที",
    ],
    benefit:
      "ของหวานเย็นหวานธรรมชาติจากกล้วย ไม่มีน้ำตาล/ครีมเพิ่ม โกโก้ให้สารต้านอนุมูลอิสระ",
    tags: ["ไม่มีเนื้อสัตว์"],
  },
  {
    id: "dst-mugcake",
    name: "เค้กโกโก้ถ้วยไมโครเวฟ",
    slot: "dessert",
    equipment: ["ไมโครเวฟ"],
    ingredients: [
      { name: "ข้าวโอ๊ต", grams: 30 },
      { name: "ผงโกโก้", grams: 8 },
      { name: "ไข่ไก่", grams: 50 },
      { name: "นมจืด", grams: 40 },
      { name: "กล้วยหอม", grams: 50 },
    ],
    steps: [
      "บดกล้วยในถ้วยทนไมโครเวฟ ใส่ไข่ 1 ฟอง + นม คนให้เข้ากัน",
      "ใส่ข้าวโอ๊ต + ผงโกโก้ คนให้ทั่ว",
      "ไมโครเวฟ ~2 นาที จนเซ็ตตัว (ระวังร้อน)",
    ],
    benefit:
      "เค้กช็อกโกแลตแบบ healthy โปรตีนจากไข่ คาร์บเชิงซ้อนจากโอ๊ต ทำเสร็จใน 2 นาที",
    tags: ["ไม่มีเนื้อสัตว์"],
  },
  {
    id: "dst-protein-mousse",
    name: "มูสโปรตีนโกโก้",
    slot: "dessert",
    equipment: ["ไม่ต้องปรุง"],
    ingredients: [
      { name: "กรีกโยเกิร์ต", grams: 150 },
      { name: "เวย์โปรตีน", grams: 15 },
      { name: "ผงโกโก้", grams: 5 },
    ],
    steps: [
      "ใส่กรีกโยเกิร์ต + เวย์ครึ่งสกู๊ป + ผงโกโก้ ในถ้วย",
      "คนให้เนียนเป็นมูส แช่เย็น 10 นาทีถ้าชอบเย็น",
    ],
    benefit:
      "ของหวานโปรตีนสูงสุด ~28 ก. คุมความอยากของหวานระหว่างลดไขมันได้ดี",
    tags: ["โปรตีนสูง", "ทำเร็ว", "ไม่มีเนื้อสัตว์"],
  },
  {
    id: "dst-apple-cinnamon",
    name: "แอปเปิลอบอบเชยไมโครเวฟ + อัลมอนด์",
    slot: "dessert",
    equipment: ["ไมโครเวฟ"],
    ingredients: [
      { name: "แอปเปิล", grams: 150 },
      { name: "อบเชย", grams: 1 },
      { name: "ข้าวโอ๊ต", grams: 15 },
      { name: "อัลมอนด์", grams: 10 },
    ],
    steps: [
      "หั่นแอปเปิลเป็นชิ้นใส่ถ้วย โรยอบเชย",
      "ไมโครเวฟ ~2 นาที จนนุ่ม",
      "โรยข้าวโอ๊ต + อัลมอนด์สับด้านบน",
    ],
    benefit:
      "ของหวานอุ่น ๆ ไฟเบอร์สูง อบเชยช่วยคุมระดับน้ำตาล หวานธรรมชาติจากแอปเปิล",
    tags: ["ไม่มีเนื้อสัตว์"],
  },
```

- [ ] **Step 4: ตรวจ build + เทสต์**

Run: `bun run build`
Expected: build ผ่าน (MEAL_SLOT_LABEL มี key dessert ครบ ไม่มี type error)

Run: `bun test src/lib`
Expected: PASS ทั้งหมด (week balance ไม่กระทบ — เมนูใหม่ไม่อยู่ใน week.ts; `recipesForSlot("breakfast")` ยัง ≥ 2)

- [ ] **Step 5: commit**

```bash
git add src/data/types.ts src/data/ingredients.ts src/data/recipes.ts
git commit -m "feat(content): dessert slot, cocoa/cinnamon, 5 desserts + 4 recipe variants"
```

---

## Task 2: recipe-filter.ts + tests (incl. referential integrity)

**Files:**
- Create: `src/lib/recipe-filter.ts`
- Test: `src/lib/recipe-filter.test.ts`

**Interfaces:**
- Consumes: `recipes`, `ingredientCatalog`, `pantryStaples`, `Recipe` (จาก Task 1 data)
- Produces: `RECIPE_FILTERS: RecipeFilter[]`, `filterRecipes(recipes, filterId: string | null): Recipe[]`, type `RecipeFilter = { id, label, match }`

- [ ] **Step 1: เขียนเทสต์ `src/lib/recipe-filter.test.ts`**

```ts
import { describe, it, expect } from "bun:test";
import { recipes } from "@/data/recipes";
import { ingredientCatalog, pantryStaples } from "@/data/ingredients";
import { filterRecipes } from "./recipe-filter";

describe("filterRecipes", () => {
  it("null → คืนทั้งหมด", () => {
    expect(filterRecipes(recipes, null).length).toBe(recipes.length);
  });
  it("dessert → เฉพาะของหวาน 5 เมนู", () => {
    const d = filterRecipes(recipes, "dessert");
    expect(d.length).toBe(5);
    expect(d.every((r) => r.slot === "dessert")).toBe(true);
  });
  it("nopan → ไม่มีเมนูที่ใช้กระทะไฟฟ้า", () => {
    const r = filterRecipes(recipes, "nopan");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => !x.equipment.includes("กระทะไฟฟ้า"))).toBe(true);
  });
  it("nomeat → ทุกเมนูมีแท็ก ไม่มีเนื้อสัตว์", () => {
    const r = filterRecipes(recipes, "nomeat");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.tags?.includes("ไม่มีเนื้อสัตว์"))).toBe(true);
  });
  it("id ที่ไม่รู้จัก → คืนทั้งหมด", () => {
    expect(filterRecipes(recipes, "zzz").length).toBe(recipes.length);
  });
});

describe("referential integrity", () => {
  const known = new Set(
    [...ingredientCatalog, ...pantryStaples].map((c) => c.name)
  );
  it("ทุกวัตถุดิบในเมนูมีใน catalog/pantry", () => {
    const missing: string[] = [];
    for (const r of recipes)
      for (const ing of r.ingredients)
        if (!known.has(ing.name)) missing.push(`${r.id}:${ing.name}`);
    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 2: รันเทสต์ ให้ fail**

Run: `bun test src/lib/recipe-filter.test.ts`
Expected: FAIL (`Cannot find module './recipe-filter'`)

- [ ] **Step 3: เขียน `src/lib/recipe-filter.ts`**

```ts
import type { Recipe } from "@/data/types";

export type RecipeFilter = {
  id: string;
  label: string;
  match: (r: Recipe) => boolean;
};

export const RECIPE_FILTERS: RecipeFilter[] = [
  { id: "protein", label: "โปรตีนสูง", match: (r) => !!r.tags?.includes("โปรตีนสูง") },
  { id: "fast", label: "ทำเร็ว", match: (r) => !!r.tags?.includes("ทำเร็ว") },
  { id: "nomeat", label: "ไม่มีเนื้อสัตว์", match: (r) => !!r.tags?.includes("ไม่มีเนื้อสัตว์") },
  { id: "pre", label: "ก่อนเล่น", match: (r) => r.slot === "preworkout" || !!r.tags?.includes("ก่อนเล่น") },
  { id: "post", label: "หลังเล่น", match: (r) => r.slot === "postworkout" },
  { id: "dessert", label: "ของหวาน", match: (r) => r.slot === "dessert" },
  { id: "nopan", label: "ไม่ต้องใช้กระทะ", match: (r) => !r.equipment.includes("กระทะไฟฟ้า") },
];

const BY_ID = new Map(RECIPE_FILTERS.map((f) => [f.id, f] as const));

/** filterId = null หรือไม่รู้จัก → คืนทั้งหมด */
export function filterRecipes(recipes: Recipe[], filterId: string | null): Recipe[] {
  if (!filterId) return recipes;
  const f = BY_ID.get(filterId);
  if (!f) return recipes;
  return recipes.filter(f.match);
}
```

- [ ] **Step 4: รันเทสต์ ให้ผ่าน**

Run: `bun test src/lib`
Expected: PASS ทั้งหมด (รวมเทสต์เดิม + referential integrity ยืนยันว่าโกโก้/อบเชยถูกเพิ่มใน catalog แล้ว)

- [ ] **Step 5: commit**

```bash
git add src/lib/recipe-filter.ts src/lib/recipe-filter.test.ts
git commit -m "feat(menu): recipe filter predicates + referential integrity test"
```

---

## Task 3: menu-library filter UI + หมวดของหวาน

**Files:**
- Modify: `src/components/views/menu-library-view.tsx` (เขียนใหม่ทั้งไฟล์ — เป็น client + ชิป + dessert)

**Interfaces:**
- Consumes: `RECIPE_FILTERS`, `filterRecipes` (Task 2); `recipeMacros`, `NutritionStrip` (เดิม); `MEAL_SLOT_LABEL` (มี dessert จาก Task 1)

- [ ] **Step 1: เขียน `src/components/views/menu-library-view.tsx` ใหม่ทั้งไฟล์**

```tsx
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
          คลังเมนูทั้งหมด พร้อมวัตถุดิบและวิธีทำ — กด “สลับ” ในแท็บ 🍱 อาหาร
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
```

- [ ] **Step 2: ตรวจ build + เทสต์**

Run: `bun run build` → ผ่าน
Run: `bun test src/lib` → PASS

- [ ] **Step 3: ตรวจเบราว์เซอร์**

แท็บ 📖 เมนู:
- มีแถบชิปบนสุด: ทั้งหมด / โปรตีนสูง / ทำเร็ว / ไม่มีเนื้อสัตว์ / ก่อนเล่น / หลังเล่น / ของหวาน / ไม่ต้องใช้กระทะ
- มีหมวด "ของหวาน (5)" แสดงของหวาน 5 เมนู (มีมาโคร + ✨ ประโยชน์)
- กดชิป "ของหวาน" → เหลือเฉพาะหมวดของหวาน; กด "ไม่ต้องใช้กระทะ" → ซ่อนเมนูที่ใช้กระทะ + ซ่อนหมวดว่าง; กดซ้ำ/ทั้งหมด → กลับมาครบ
- แท็บ 🍱 อาหาร กด "สลับ" มื้อเช้า → เห็น `bf-yogurt-oat` เป็นตัวเลือก (เมนูสลับใหม่โผล่)

- [ ] **Step 4: commit**

```bash
git add src/components/views/menu-library-view.tsx
git commit -m "feat(menu): filter chips + dessert section in menu library"
```

---

## Self-Review (ผู้เขียนแผนตรวจเองแล้ว)

**Spec coverage:**
- ของหวาน slot ใหม่ + 5 เมนู → Task 1 (data) + Task 3 (SLOT_ORDER แสดง) ✓
- วัตถุดิบใหม่ โกโก้/อบเชย → Task 1 ✓ (referential integrity test ใน Task 2 ยืนยัน)
- เมนูหลากหลาย ~4 → Task 1 ✓
- ฟิลเตอร์แท็ก+อุปกรณ์ ทีละชิป → Task 2 (logic) + Task 3 (UI) ✓
- ของหวานไม่อยู่ใน week.ts/ไม่กระทบ balance → Global Constraints + Task 1 (ไม่แตะ week.ts) ✓

**Placeholder scan:** ไม่มี TBD/TODO — โค้ดครบทุก step ✓

**Type consistency:** `MealSlot`+`"dessert"`, `MEAL_SLOT_LABEL`, `RecipeFilter`/`RECIPE_FILTERS`/`filterRecipes`, recipe id ใหม่, ingredient ชื่อ `ผงโกโก้`/`อบเชย` ตรงกันทุก task ✓

**Scope:** หนึ่งสเปคคอนเทนต์อาหารเดียว (3 tasks) เหมาะกับ 1 แผน ✓
