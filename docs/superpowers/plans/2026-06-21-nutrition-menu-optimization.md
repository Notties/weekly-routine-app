# Nutrition + Menu Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มข้อมูลโภชนาการ (kcal + P/C/F) + ประโยชน์ ให้ทุกเมนู คำนวณอัตโนมัติจากวัตถุดิบ และจัดปริมาณ/เมนูทั้งสัปดาห์ให้เข้าเป้าต่อวัน พร้อมแสดงในการ์ดมื้อ/คลังเมนู/สรุปต่อวัน

**Architecture:** มาโครเป็น single source of truth — เก็บ "มาโครต่อ 100 ก." ที่วัตถุดิบ (`ingredients.ts`) + "กรัมต่อเมนู" ที่ recipe (`recipes.ts`) แล้ว `lib/nutrition.ts` คำนวณมาโครของเมนู/วัน + เป้าต่อวันจากโปรไฟล์ UI ใช้ผลลัพธ์ที่ resolve แล้วใน `Meal`

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, lucide-react, `bun test` (import จาก `bun:test`)

## Global Constraints

- ทุกเมนูต้อง **มือใหม่ทำได้** ด้วย 4 อุปกรณ์เท่านั้น: กระทะไฟฟ้า / ไมโครเวฟ / เครื่องต้มไข่ / หม้อหุงข้าว (+ "ไม่ต้องปรุง")
- ใช้วัตถุดิบจาก **catalog เดิม** เท่านั้น (ไม่เพิ่มของแพง/ของใหม่) — ทุกชื่อใน recipe ต้องมีใน `ingredientCatalog` หรือ `pantryStaples`
- โปรไฟล์เป้าหมาย: ชาย / 25 ปี / 167 ซม. / **75 กก.** / เพิ่มกล้าม–ลดไขมัน
- หน่วยน้ำหนัก: เนื้อสัตว์ = น้ำหนัก**ดิบ**, ข้าว = น้ำหนัก**สุก**, อื่น ๆ = ตามที่กิน
- ภาษา UI = ไทยทั้งหมด, ตัวเลขใช้คลาส `tnum`, การ์ดใช้ `rounded-2xl border border-border bg-card`
- รันเทสต์: `bun test src/lib` · ตรวจ type ทั้งแอป: `bun run build`
- ตาม AGENTS.md: ถ้าจะใช้ API ของ Next ตัวใหม่ ให้เปิดดู `node_modules/next/dist/docs/` ก่อน (งานนี้แตะแค่ data + presentational components — ไม่มี API routing/data fetching ใหม่)

### มาโครต่อ 100 ก. (ค่าอ้างอิงที่ใช้ตลอดแผน)

| วัตถุดิบ | kcal | P | C | F |
|---|--:|--:|--:|--:|
| อกไก่ | 120 | 23 | 0 | 2.5 |
| หมูสันใน | 120 | 21 | 0 | 3.5 |
| ไข่ไก่ | 143 | 12.6 | 0.7 | 9.5 |
| กรีกโยเกิร์ต | 60 | 10 | 4 | 0.5 |
| นมจืด | 60 | 3.2 | 4.8 | 3.3 |
| เวย์โปรตีน | 400 | 80 | 10 | 5 |
| ข้าวกล้อง | 130 | 2.7 | 28 | 0.3 |
| ข้าวโอ๊ต | 380 | 13 | 67 | 7 |
| ขนมปังโฮลวีท | 250 | 12 | 43 | 3.5 |
| ผักรวมแช่แข็ง | 45 | 2.5 | 8 | 0.4 |
| กล้วยหอม | 89 | 1.1 | 23 | 0.3 |
| แอปเปิล | 52 | 0.3 | 14 | 0.2 |
| อัลมอนด์ | 580 | 21 | 22 | 50 |
| เนยถั่ว | 590 | 25 | 20 | 50 |
| กาแฟดำ | 0 | 0 | 0 | 0 |
| น้ำมันรำข้าว | 884 | 0 | 0 | 100 |
| เกลือ/พริกไทยป่น/ซีอิ๊วขาว/น้ำปลา/กระเทียมสับ | 0 | 0 | 0 | 0 |

### เป้าหมายต่อวัน (ผลลัพธ์ที่ `dailyTarget` ต้องคืน สำหรับโปรไฟล์นี้)

| ชนิดวัน | kcal | P | C | F |
|---|--:|--:|--:|--:|
| weights | 2200 | 150 | 265 | 60 |
| cardio | 2050 | 150 | 228 | 60 |
| rest | 1850 | 150 | 178 | 60 |

---

## File Structure

| ไฟล์ | ความรับผิดชอบ |
|---|---|
| `src/data/types.ts` | + `Macros`, `RecipeItem`; แก้ `CatalogItem`, `Recipe`, `Meal`, `Profile` |
| `src/data/ingredients.ts` | + `macrosPer100g` ทุกตัว |
| `src/data/profile.ts` | + `weightKg` |
| `src/data/recipes.ts` | ingredients → `{name,grams}[]`, + `benefit`, ปรับปริมาณเข้าเป้า |
| `src/data/week.ts` | เพิ่มของว่างวันพัก + เปลี่ยนเช้าวันอาทิตย์ |
| `src/lib/nutrition.ts` (ใหม่) | `macrosOf`, `recipeMacros`, `sumMacros`, `dailyTarget` |
| `src/lib/nutrition.test.ts` (ใหม่) | เทสต์ตรรกะข้างบน |
| `src/lib/meals.ts` | `resolveMeal` พ่วง `macros` + `benefit` |
| `src/lib/shopping.ts` | อ่าน `ingredients[].name` |
| `src/lib/meals.test.ts` | อัปเดต fixture `CatalogItem` ให้มี `macrosPer100g` |
| `src/components/nutrition-strip.tsx` (ใหม่) | แถบมาโคร |
| `src/components/daily-nutrition-summary.tsx` (ใหม่) | สรุปวัน vs เป้า |
| `src/components/meal-card.tsx` | + strip + benefit |
| `src/components/views/meal-view.tsx` | + กล่องสรุป |
| `src/components/views/menu-library-view.tsx` | + strip + benefit + กรัม |

---

## Task 1: Nutrition foundation (types + ingredient macros + profile + primitives)

ส่วนนี้ **เพิ่มแบบไม่ทำลายของเดิม** — `Recipe.ingredients` ยังเป็น `string[]` อยู่ ทำให้ทั้งแอปยัง build ผ่าน

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/ingredients.ts`
- Modify: `src/data/profile.ts`
- Create: `src/lib/nutrition.ts`
- Test: `src/lib/nutrition.test.ts`

**Interfaces:**
- Produces:
  - `type Macros = { kcal: number; protein: number; carb: number; fat: number }`
  - `type RecipeItem = { name: string; grams: number }`
  - `CatalogItem = ShopItem & { macrosPer100g: Macros }`
  - `Profile.weightKg: number`
  - `macrosOf(name: string, grams: number): Macros` (ค่า**ไม่ปัดเศษ**; ชื่อไม่รู้จัก → ทุกค่าเป็น 0)
  - `sumMacros(list: Macros[]): Macros`
  - `dailyTarget(profile: Profile, type: DayType): Macros` (ปัด kcal เป็นพหุคูณของ 10)

- [ ] **Step 1: เพิ่ม type ใน `src/data/types.ts`**

เพิ่มหลังคอมเมนต์หัวไฟล์ (บนสุด ก่อน `export type DayKey`):

```ts
/** มาโคร: แคลอรี่ + โปรตีน/คาร์บ/ไขมัน (กรัม) */
export type Macros = {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
};

/** วัตถุดิบในเมนู: ชื่อ (อ้าง catalog) + กรัมที่ใช้จริงต่อ 1 ที่ */
export type RecipeItem = { name: string; grams: number };
```

เพิ่มฟิลด์ `weightKg` ใน `Profile`:

```ts
export type Profile = {
  sex: string;
  age: number;
  heightCm: number;
  /** น้ำหนักปัจจุบัน (กก.) — ใช้คำนวณเป้าโภชนาการ */
  weightKg: number;
  goal: string;
  /** ช่วงเวลาออกกำลังประจำ เช่น "19:00–20:00" */
  workoutWindow: string;
};
```

เปลี่ยนนิยาม `CatalogItem` (เดิม `export type CatalogItem = ShopItem;`) เป็น:

```ts
/**
 * รายการในคลังวัตถุดิบ (ingredient catalog) — ราคาต่อสัปดาห์ + มาโครต่อ 100 ก.
 * รายการซื้อของจะหยิบเฉพาะวัตถุดิบที่เมนูในสัปดาห์นั้นใช้จริง
 */
export type CatalogItem = ShopItem & {
  /** มาโครต่อวัตถุดิบ 100 กรัม — ใช้คำนวณโภชนาการของเมนู */
  macrosPer100g: Macros;
};
```

- [ ] **Step 2: เพิ่ม `macrosPer100g` ทุกตัวใน `src/data/ingredients.ts`**

แทนที่ทั้งสอง array ด้วยเวอร์ชันที่มี `macrosPer100g` (อิงตารางใน Global Constraints):

```ts
import type { CatalogItem } from "./types";

// ───────────────────────────────────────────────────────────
// คลังวัตถุดิบ — qty บอกยี่ห้อ/แพ็กที่ Makro · price อิงราคา Makro โดยประมาณ
// macrosPer100g = มาโครต่อ 100 ก. (อ้างค่ามาตรฐาน ปรับตามฉลากจริงได้)
// หน่วยเทียบ: ไข่ 1 ฟอง ≈ 50 ก. · กล้วย 1 ลูก ≈ 100 ก. · แอปเปิล 1 ลูก ≈ 150 ก.
//   ขนมปัง 1 แผ่น ≈ 30 ก. · นม 1 กล่อง 250 มล. ≈ 250 ก. · เวย์ 1 สกู๊ป ≈ 30 ก.
//   อัลมอนด์ 1 กำมือ ≈ 28 ก. · เนยถั่ว 1 ช้อนโต๊ะ ≈ 16 ก. · น้ำมัน 1 ช้อน (ดูดซับ) ≈ 5 ก.
// เนื้อสัตว์ = น้ำหนักดิบ · ข้าว = น้ำหนักสุก
// ───────────────────────────────────────────────────────────

export const ingredientCatalog: CatalogItem[] = [
  // ── โปรตีน ──
  { name: "อกไก่", qty: "เอโร่ แช่แข็ง ~3 กก. (โลละ ~100฿)", price: 300, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 120, protein: 23, carb: 0, fat: 2.5 } },
  { name: "หมูสันใน", qty: "CP สันในหมู 1 กก.", price: 160, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 120, protein: 21, carb: 0, fat: 3.5 } },
  { name: "ไข่ไก่", qty: "เอโร่ เบอร์ 2-3 แผง 30 ฟอง", price: 120, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 143, protein: 12.6, carb: 0.7, fat: 9.5 } },
  { name: "กรีกโยเกิร์ต", qty: "4 ถ้วย (หรือกระปุกใหญ่ 1 กก.)", price: 180, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 60, protein: 10, carb: 4, fat: 0.5 } },
  { name: "นมจืด", qty: "UHT จืด 1 ลิตร x2", price: 60, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 60, protein: 3.2, carb: 4.8, fat: 3.3 } },
  { name: "เวย์โปรตีน", qty: "ON Gold Standard 2 ปอนด์ (907 ก. ~30 มื้อ)", price: 1290, category: "โปรตีน", recurring: true, macrosPer100g: { kcal: 400, protein: 80, carb: 10, fat: 5 } },

  // ── คาร์บ ──
  { name: "ข้าวกล้อง", qty: "หงษ์ทอง/เอโร่ หอมมะลิ 5 กก.", price: 230, category: "คาร์บ", recurring: true, macrosPer100g: { kcal: 130, protein: 2.7, carb: 28, fat: 0.3 } },
  { name: "ข้าวโอ๊ต", qty: "ควิกโอ๊ต 1 กก.", price: 150, category: "คาร์บ", recurring: true, macrosPer100g: { kcal: 380, protein: 13, carb: 67, fat: 7 } },
  { name: "ขนมปังโฮลวีท", qty: "โฮลวีท 1 แถว", price: 55, category: "คาร์บ", recurring: false, macrosPer100g: { kcal: 250, protein: 12, carb: 43, fat: 3.5 } },

  // ── ผัก ──
  { name: "ผักรวมแช่แข็ง", qty: "เอโร่ บรอกโคลี/แครอท/ข้าวโพด 1.5 กก.", price: 70, category: "ผัก", recurring: false, macrosPer100g: { kcal: 45, protein: 2.5, carb: 8, fat: 0.4 } },

  // ── ผลไม้ ──
  { name: "กล้วยหอม", qty: "1 หวี", price: 40, category: "ผลไม้", recurring: false, macrosPer100g: { kcal: 89, protein: 1.1, carb: 23, fat: 0.3 } },
  { name: "แอปเปิล", qty: "6 ลูก", price: 80, category: "ผลไม้", recurring: false, macrosPer100g: { kcal: 52, protein: 0.3, carb: 14, fat: 0.2 } },

  // ── ไขมันดี ──
  { name: "อัลมอนด์", qty: "อัลมอนด์ดิบ 500 ก.", price: 200, category: "ไขมันดี", recurring: false, macrosPer100g: { kcal: 580, protein: 21, carb: 22, fat: 50 } },
  { name: "เนยถั่ว", qty: "1 กระปุก (~500 ก.)", price: 120, category: "ไขมันดี", recurring: true, macrosPer100g: { kcal: 590, protein: 25, carb: 20, fat: 50 } },

  // ── เครื่องดื่ม ──
  { name: "กาแฟดำ", qty: "กาแฟคั่วบด/ผงกาแฟดำ 1 ถุง", price: 130, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
];

/** ของครัวพื้นฐานที่ต้องมีติดบ้านเสมอ (ใส่ในรายการซื้อของตลอด ไม่ขึ้นกับเมนู) */
export const pantryStaples: CatalogItem[] = [
  { name: "น้ำมันรำข้าว", qty: "1 ลิตร (ทอด/ผัดได้ดี ราคาถูก)", price: 65, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 884, protein: 0, carb: 0, fat: 100 } },
  { name: "เกลือ", qty: "1 ถุง", price: 15, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
  { name: "พริกไทยป่น", qty: "1 กระปุก", price: 30, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
  { name: "ซีอิ๊วขาว", qty: "1 ขวด", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
  { name: "น้ำปลา", qty: "1 ขวด", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
  { name: "กระเทียมสับ", qty: "1 กระปุก/ถุง", price: 30, category: "เครื่องปรุง", recurring: false, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
];
```

- [ ] **Step 3: เพิ่ม `weightKg` ใน `src/data/profile.ts`**

```ts
import type { Profile } from "./types";

// แก้ข้อมูลโปรไฟล์ได้ที่นี่
export const profile: Profile = {
  sex: "ชาย",
  age: 25,
  heightCm: 167,
  weightKg: 75,
  goal: "เพิ่มกล้าม–ลดไขมัน",
  workoutWindow: "19:00–20:00",
};
```

- [ ] **Step 4: เขียนเทสต์ที่ยังไม่ผ่าน `src/lib/nutrition.test.ts`**

```ts
import { describe, it, expect } from "bun:test";
import { macrosOf, sumMacros, dailyTarget } from "./nutrition";
import { profile } from "@/data/profile";

describe("macrosOf", () => {
  it("อกไก่ 200 ก. = 2 เท่าของต่อ 100 ก.", () => {
    expect(macrosOf("อกไก่", 200)).toEqual({ kcal: 240, protein: 46, carb: 0, fat: 5 });
  });

  it("หาเจอใน pantry ด้วย (น้ำมันรำข้าว 5 ก.)", () => {
    const m = macrosOf("น้ำมันรำข้าว", 5);
    expect(m.kcal).toBeCloseTo(44.2, 1);
    expect(m.fat).toBeCloseTo(5, 1);
  });

  it("ชื่อที่ไม่รู้จัก → ทุกค่าเป็น 0", () => {
    expect(macrosOf("ไม่มีจริง", 100)).toEqual({ kcal: 0, protein: 0, carb: 0, fat: 0 });
  });
});

describe("sumMacros", () => {
  it("รวมหลายมื้อ", () => {
    expect(
      sumMacros([
        { kcal: 100, protein: 10, carb: 5, fat: 2 },
        { kcal: 200, protein: 20, carb: 10, fat: 3 },
      ])
    ).toEqual({ kcal: 300, protein: 30, carb: 15, fat: 5 });
  });

  it("ลิสต์ว่าง = 0", () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, carb: 0, fat: 0 });
  });
});

describe("dailyTarget (ชาย 75 กก./167/25)", () => {
  it("วันเล่นเวต", () => {
    expect(dailyTarget(profile, "weights")).toEqual({ kcal: 2200, protein: 150, carb: 265, fat: 60 });
  });
  it("วันคาร์ดิโอ", () => {
    expect(dailyTarget(profile, "cardio")).toEqual({ kcal: 2050, protein: 150, carb: 228, fat: 60 });
  });
  it("วันพัก", () => {
    expect(dailyTarget(profile, "rest")).toEqual({ kcal: 1850, protein: 150, carb: 178, fat: 60 });
  });
});
```

- [ ] **Step 5: รันเทสต์ ให้ fail**

Run: `bun test src/lib/nutrition.test.ts`
Expected: FAIL — `Cannot find module './nutrition'` (ยังไม่ได้สร้างไฟล์)

- [ ] **Step 6: เขียน `src/lib/nutrition.ts` (เฉพาะ primitives)**

```ts
import { ingredientCatalog, pantryStaples } from "@/data/ingredients";
import type { DayType, Macros, Profile } from "@/data/types";

// แผนที่ชื่อวัตถุดิบ → มาโครต่อ 100 ก. (รวมทั้ง catalog + ของครัวพื้นฐาน)
const macroByName = new Map<string, Macros>(
  [...ingredientCatalog, ...pantryStaples].map(
    (c) => [c.name, c.macrosPer100g] as const
  )
);

const ZERO: Macros = { kcal: 0, protein: 0, carb: 0, fat: 0 };

/** มาโครของวัตถุดิบ 1 ชนิดตามกรัม (ไม่ปัดเศษ) — ชื่อไม่รู้จักคืน 0 */
export function macrosOf(name: string, grams: number): Macros {
  const per100 = macroByName.get(name);
  if (!per100) return { ...ZERO };
  const k = grams / 100;
  return {
    kcal: per100.kcal * k,
    protein: per100.protein * k,
    carb: per100.carb * k,
    fat: per100.fat * k,
  };
}

/** รวมมาโครหลายก้อน */
export function sumMacros(list: Macros[]): Macros {
  return list.reduce<Macros>(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      protein: a.protein + m.protein,
      carb: a.carb + m.carb,
      fat: a.fat + m.fat,
    }),
    { ...ZERO }
  );
}

// ── เป้าหมายต่อวัน ──
const ACTIVITY: Record<DayType, number> = { weights: 1.5, cardio: 1.45, rest: 1.3 };
const DEFICIT: Record<DayType, number> = { weights: 310, cardio: 380, rest: 325 };
const PROTEIN_PER_KG = 2.0; // รักษากล้ามระหว่างลดไขมัน
const FAT_PER_KG = 0.8;

/** BMR (Mifflin-St Jeor) */
function bmr(p: Profile): number {
  const sexConst = p.sex === "ชาย" ? 5 : -161;
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + sexConst;
}

/** เป้ามาโครต่อวันตามชนิดวัน — kcal ปัดเป็นพหุคูณของ 10 */
export function dailyTarget(p: Profile, type: DayType): Macros {
  const tdee = bmr(p) * ACTIVITY[type];
  const kcal = Math.round((tdee - DEFICIT[type]) / 10) * 10;
  const protein = Math.round(p.weightKg * PROTEIN_PER_KG);
  const fat = Math.round(p.weightKg * FAT_PER_KG);
  const carb = Math.round((kcal - protein * 4 - fat * 9) / 4);
  return { kcal, protein, carb, fat };
}
```

- [ ] **Step 7: รันเทสต์ ให้ผ่าน**

Run: `bun test src/lib/nutrition.test.ts`
Expected: PASS ทุกเคส

- [ ] **Step 8: รันเทสต์ทั้งหมด + commit**

Run: `bun test src/lib`
Expected: PASS ทั้งหมด (ของเดิมไม่พัง — `Recipe.ingredients` ยังเป็น string[])

```bash
git add src/data/types.ts src/data/ingredients.ts src/data/profile.ts src/lib/nutrition.ts src/lib/nutrition.test.ts
git commit -m "feat(nutrition): ingredient macros + daily target primitives"
```

---

## Task 2: Recipe model → grams + benefit + recipeMacros (breaking change)

เปลี่ยน `Recipe.ingredients` เป็น `RecipeItem[]` + เพิ่ม `benefit`; อัปเดตทุกผู้บริโภคให้ build ผ่านอีกครั้ง ปริมาณในไฟล์นี้คือ **ปริมาณที่ปรับเข้าเป้าแล้ว**

**Files:**
- Modify: `src/data/types.ts` (`Recipe`, `Meal`)
- Modify: `src/data/recipes.ts` (เขียนใหม่ทั้งไฟล์)
- Modify: `src/lib/nutrition.ts` (+ `recipeMacros`)
- Modify: `src/lib/meals.ts` (`resolveMeal` พ่วง macros+benefit)
- Modify: `src/lib/shopping.ts` (อ่าน `.name`)
- Modify: `src/lib/meals.test.ts` (fixture `CatalogItem` + เทสต์ recipeMacros)
- Test: `src/lib/nutrition.test.ts` (+ recipeMacros)

**Interfaces:**
- Consumes (จาก Task 1): `Macros`, `RecipeItem`, `macrosOf`
- Produces:
  - `Recipe.ingredients: RecipeItem[]`, `Recipe.benefit: string`
  - `Meal.macros: Macros`, `Meal.benefit: string`
  - `recipeMacros(recipe: Recipe): Macros` (ผลรวม **ปัดเศษเป็นจำนวนเต็ม** ของทุกฟิลด์)

- [ ] **Step 1: แก้ type `Recipe` และ `Meal` ใน `src/data/types.ts`**

ใน `Recipe` เปลี่ยน `ingredients` + เพิ่ม `benefit`:

```ts
export type Recipe = {
  id: string;
  name: string;
  slot: MealSlot;
  equipment: Appliance[];
  /** วัตถุดิบ + กรัมต่อ 1 ที่ (อ้างอิง ingredientCatalog/pantryStaples) */
  ingredients: RecipeItem[];
  steps: string[];
  /** ประโยชน์: เมนูนี้ให้อะไร/ช่วยอะไร */
  benefit: string;
  tags?: string[];
};
```

ใน `Meal` เพิ่ม `macros` + `benefit` (หลัง `tags`):

```ts
export type Meal = {
  time: string;
  name: string;
  menu: string;
  recipeId: string;
  slot: MealSlot;
  equipment?: Appliance[];
  steps: string[];
  tags: string[];
  /** มาโครของเมนูที่เลือก (คำนวณจากวัตถุดิบ) */
  macros: Macros;
  /** ประโยชน์ของเมนูที่เลือก */
  benefit: string;
};
```

- [ ] **Step 2: เขียน `src/data/recipes.ts` ใหม่ทั้งไฟล์ (กรัม + benefit เข้าเป้า)**

```ts
import type { Recipe } from "./types";

// ───────────────────────────────────────────────────────────
// คลังเมนู — วิธีทำ (มือใหม่ทำตามได้) + วัตถุดิบพร้อมกรัม + ประโยชน์
// มาโครคำนวณอัตโนมัติจากวัตถุดิบ (lib/nutrition.ts) — ปรับ grams แล้วเลขอัปเดตเอง
// เนื้อสัตว์ = น้ำหนักดิบ · ข้าว = น้ำหนักสุก
// เพิ่มเมนูใหม่: ก๊อปบล็อก ตั้ง id ใหม่ ใส่ ingredients (ชื่อจาก ingredients.ts) + grams + benefit
// ───────────────────────────────────────────────────────────

export const recipes: Recipe[] = [
  // ── มื้อเช้า ──
  {
    id: "bf-oat",
    name: "ข้าวโอ๊ตไมโครเวฟ + ไข่ต้ม 2 ฟอง + กล้วย",
    slot: "breakfast",
    equipment: ["เครื่องต้มไข่", "ไมโครเวฟ"],
    ingredients: [
      { name: "ข้าวโอ๊ต", grams: 60 },
      { name: "นมจืด", grams: 250 },
      { name: "ไข่ไก่", grams: 100 },
      { name: "กล้วยหอม", grams: 100 },
    ],
    steps: [
      "ใส่ไข่ 2 ฟองในเครื่องต้มไข่ เติมน้ำตามขีด “สุกแข็ง” กดปุ่ม รอจนเครื่องดับเอง",
      "ใส่ข้าวโอ๊ต ~1/2 ถ้วย (60 ก.) + นมจืด 1 กล่อง ในชามทนไมโครเวฟ อุ่น 2 นาที แล้วคน (ระวังร้อน)",
      "ปอกไข่ กินคู่ข้าวโอ๊ตและกล้วย 1 ลูก",
    ],
    benefit:
      "คาร์บเชิงซ้อนจากโอ๊ตให้พลังงานยาวตลอดเช้า + โปรตีนจากไข่/นมเริ่มสร้างกล้ามตั้งแต่ตื่น ไฟเบอร์ช่วยอิ่มนาน",
    tags: ["โปรตีนสูง"],
  },
  {
    id: "bf-bread",
    name: "ขนมปังโฮลวีท 2 แผ่น + ไข่ต้ม 3 ฟอง + กล้วย",
    slot: "breakfast",
    equipment: ["เครื่องต้มไข่", "ไมโครเวฟ"],
    ingredients: [
      { name: "ขนมปังโฮลวีท", grams: 60 },
      { name: "ไข่ไก่", grams: 150 },
      { name: "เนยถั่ว", grams: 16 },
      { name: "กล้วยหอม", grams: 100 },
    ],
    steps: [
      "ต้มไข่ 3 ฟองในเครื่องต้มไข่ (ขีด “สุกแข็ง”) รอจนเครื่องดับ",
      "วางขนมปัง 2 แผ่นในจาน อุ่นไมโครเวฟ 15 วินาที (หรือกินสด) ทาเนยถั่ว 1 ช้อนโต๊ะ",
      "ปอกไข่ กินคู่ขนมปังและกล้วย",
    ],
    benefit:
      "โปรตีนสูงจากไข่ 3 ฟอง + คาร์บจากขนมปังโฮลวีท ไขมันดีจากเนยถั่ว ให้แรงต่อเนื่องครึ่งวัน",
    tags: ["โปรตีนสูง"],
  },
  {
    id: "bf-eggmilk",
    name: "ไข่ต้ม 3 ฟอง + นมจืด + แอปเปิล",
    slot: "breakfast",
    equipment: ["เครื่องต้มไข่"],
    ingredients: [
      { name: "ไข่ไก่", grams: 150 },
      { name: "นมจืด", grams: 250 },
      { name: "แอปเปิล", grams: 150 },
    ],
    steps: [
      "ต้มไข่ 3 ฟองในเครื่องต้มไข่ (ขีด “สุกแข็ง”)",
      "ดื่มนมจืด 1 กล่อง + กินแอปเปิล 1 ลูก",
      "ง่ายสุด ไม่ต้องใช้กระทะเลย",
    ],
    benefit:
      "ทำเร็วไม่ต้องใช้กระทะ ไข่+นมให้โปรตีนคุณภาพดีเริ่มเช้า + วิตามิน/ไฟเบอร์จากแอปเปิล",
    tags: ["โปรตีนสูง", "ทำเร็ว"],
  },

  // ── มื้อกลางวัน ──
  {
    id: "ln-chicken",
    name: "ข้าวกล้อง + อกไก่ทอดกระทะ + ผัก",
    slot: "lunch",
    equipment: ["หม้อหุงข้าว", "กระทะไฟฟ้า", "ไมโครเวฟ"],
    ingredients: [
      { name: "ข้าวกล้อง", grams: 220 },
      { name: "อกไก่", grams: 200 },
      { name: "ผักรวมแช่แข็ง", grams: 120 },
      { name: "น้ำมันรำข้าว", grams: 5 },
    ],
    steps: [
      "ข้าว: หุงข้าวกล้อง (หม้อหุงข้าว) ตัก ~220 ก. มื้อนี้ ที่เหลือแบ่งใส่กล่องไว้กินมื้อต่อไป",
      "อกไก่: หั่นชิ้นบาง ~200 ก. โรยเกลือ+พริกไทย → กระทะไฟฟ้าไฟกลาง น้ำมัน 1 ช้อน → ทอด 4–5 นาที/ด้าน จนข้างในไม่มีสีชมพู (ทอดเผื่อมื้อหลังเล่น แบ่งกล่อง)",
      "ผัก: ใส่ผัก+น้ำนิดหน่อยในชาม อุ่นไมโครเวฟ 2 นาที",
    ],
    benefit:
      "อกไก่โปรตีนสูงไขมันต่ำ = วัตถุดิบหลักสร้างกล้าม + ข้าวกล้องคาร์บเชิงซ้อนเติมพลังงาน ผักให้ไฟเบอร์/วิตามิน",
    tags: ["โปรตีนสูง"],
  },
  {
    id: "ln-pork",
    name: "ข้าวกล้อง + หมูสันในทอดกระทะ + ผัก",
    slot: "lunch",
    equipment: ["หม้อหุงข้าว", "กระทะไฟฟ้า", "ไมโครเวฟ"],
    ingredients: [
      { name: "ข้าวกล้อง", grams: 220 },
      { name: "หมูสันใน", grams: 200 },
      { name: "ผักรวมแช่แข็ง", grams: 120 },
      { name: "น้ำมันรำข้าว", grams: 5 },
    ],
    steps: [
      "ข้าว: ตักข้าวกล้องที่หุงไว้ ~220 ก. อุ่นไมโครเวฟ 1–2 นาที",
      "หมู: หั่นชิ้นบาง ~200 ก. โรยเกลือ+พริกไทย → กระทะไฟฟ้าไฟกลาง น้ำมัน 1 ช้อน → ทอด 4–5 นาที/ด้าน จนสุกทั่ว",
      "ผัก: อุ่นไมโครเวฟ 2 นาที (หรือต้มในกระทะ 3 นาที)",
    ],
    benefit:
      "หมูสันในโปรตีนสูงไขมันต่ำ สลับกับไก่กันเบื่อ ให้กรดอะมิโนครบช่วยสร้างกล้าม",
    tags: ["โปรตีนสูง"],
  },
  {
    id: "ln-omelet",
    name: "ข้าวกล้อง + ไข่เจียวกระทะ + ผัก",
    slot: "lunch",
    equipment: ["หม้อหุงข้าว", "กระทะไฟฟ้า", "ไมโครเวฟ"],
    ingredients: [
      { name: "ข้าวกล้อง", grams: 220 },
      { name: "ไข่ไก่", grams: 150 },
      { name: "ผักรวมแช่แข็ง", grams: 120 },
      { name: "น้ำมันรำข้าว", grams: 5 },
    ],
    steps: [
      "ข้าว: ตักข้าวกล้องที่หุงไว้ ~220 ก. อุ่นไมโครเวฟ 1–2 นาที",
      "ไข่เจียว: ตอกไข่ 3 ฟอง ตีใส่เกลือนิดหน่อย → กระทะไฟฟ้าไฟกลาง น้ำมัน 1 ช้อน → เทไข่ ทอด 2 นาที/ด้าน",
      "ผัก: อุ่นไมโครเวฟ 2 นาที",
    ],
    benefit:
      "เมนูไม่มีเนื้อสัตว์ ไข่ให้โปรตีนคุณภาพดี + ข้าวกล้องเป็นพลังงาน ทำง่ายในกระทะเดียว",
    tags: ["ไม่มีเนื้อสัตว์"],
  },

  // ── ก่อนเล่น ──
  {
    id: "pw-banana",
    name: "กล้วย + เนยถั่ว + กาแฟดำ",
    slot: "preworkout",
    equipment: ["ไม่ต้องปรุง"],
    ingredients: [
      { name: "กล้วยหอม", grams: 120 },
      { name: "เนยถั่ว", grams: 16 },
      { name: "กาแฟดำ", grams: 200 },
    ],
    steps: [
      "ทาเนยถั่ว 1 ช้อนโต๊ะบนกล้วย กินก่อนเล่น ~1.5 ชม. ให้มีแรง",
      "ชงกาแฟดำ (ไม่ใส่น้ำตาล) เพิ่มโฟกัส/แรงก่อนเล่น",
    ],
    benefit:
      "กล้วยคาร์บย่อยเร็วให้พลังงานพร้อมเล่น + เนยถั่วไขมันดีกันหมดแรงกลางทาง คาเฟอีนเพิ่มโฟกัส",
    tags: ["ก่อนเล่น"],
  },
  {
    id: "pw-bread",
    name: "ขนมปัง 2 แผ่น + เนยถั่ว + กาแฟดำ",
    slot: "preworkout",
    equipment: ["ไม่ต้องปรุง"],
    ingredients: [
      { name: "ขนมปังโฮลวีท", grams: 60 },
      { name: "เนยถั่ว", grams: 16 },
      { name: "กาแฟดำ", grams: 200 },
    ],
    steps: [
      "ทาเนยถั่วบนขนมปัง 2 แผ่น กินก่อนเล่น ~1.5 ชม.",
      "ชงกาแฟดำถ้าต้องการ",
    ],
    benefit:
      "ขนมปัง+เนยถั่วให้คาร์บ+ไขมันดี เป็นเชื้อเพลิงก่อนยกเวตหนัก",
    tags: ["ก่อนเล่น"],
  },

  // ── หลังเล่น ──
  {
    id: "po-whey-rice",
    name: "เวย์โปรตีน + ข้าวกล้อง + อกไก่ + ผัก",
    slot: "postworkout",
    equipment: ["ไมโครเวฟ", "กระทะไฟฟ้า"],
    ingredients: [
      { name: "เวย์โปรตีน", grams: 30 },
      { name: "ข้าวกล้อง", grams: 230 },
      { name: "อกไก่", grams: 170 },
      { name: "ผักรวมแช่แข็ง", grams: 100 },
    ],
    steps: [
      "ดื่มเวย์ 1 สกู๊ปผสมน้ำเปล่าทันทีหลังเล่น",
      "อุ่นข้าว+อกไก่กล่องที่ทำไว้ตอนกลางวัน ไมโครเวฟ 2 นาที (หรือทอดอกไก่สดในกระทะ 4–5 นาที/ด้าน)",
      "อุ่นผักไมโครเวฟ 2 นาที กินให้ครบภายใน 1 ชม. หลังเล่น",
    ],
    benefit:
      "เวย์โปรตีนดูดซึมเร็ว + อกไก่ + ข้าวเติมไกลโคเจน หลังเล่นทันที = ช่วงทองซ่อมและสร้างกล้าม",
    tags: ["หลังเล่น = ซ่อมกล้าม"],
  },
  {
    id: "po-whey-egg",
    name: "เวย์โปรตีน + กล้วย + ไข่ต้ม 3 ฟอง",
    slot: "postworkout",
    equipment: ["เครื่องต้มไข่"],
    ingredients: [
      { name: "เวย์โปรตีน", grams: 30 },
      { name: "กล้วยหอม", grams: 100 },
      { name: "ไข่ไก่", grams: 150 },
    ],
    steps: [
      "ดื่มเวย์ 1 สกู๊ปผสมน้ำเปล่าทันทีหลังเล่น พร้อมกินกล้วย",
      "ต้มไข่ 3 ฟอง (เครื่องต้มไข่) กินเสริมโปรตีน",
      "เวอร์ชันเร็ว ไม่ต้องใช้กระทะ",
    ],
    benefit:
      "เวย์+ไข่+กล้วย เวอร์ชันเร็วไม่ต้องใช้กระทะ ส่งโปรตีนเข้ากล้ามทันทีหลังเล่น",
    tags: ["หลังเล่น = ซ่อมกล้าม", "ทำเร็ว"],
  },

  // ── ของว่าง ──
  {
    id: "sn-yogurt",
    name: "กรีกโยเกิร์ต + อัลมอนด์ 1 กำมือ",
    slot: "snack",
    equipment: ["ไม่ต้องปรุง"],
    ingredients: [
      { name: "กรีกโยเกิร์ต", grams: 150 },
      { name: "อัลมอนด์", grams: 28 },
    ],
    steps: ["ตักกรีกโยเกิร์ต 1 ถ้วย โรยอัลมอนด์ 1 กำมือ", "กินก่อนคาร์ดิโอให้มีแรง"],
    benefit:
      "กรีกโยเกิร์ตโปรตีนสูง + อัลมอนด์ไขมันดี อิ่มท้องเบา ๆ ก่อนคาร์ดิโอให้มีแรง",
    tags: ["ก่อนเล่น", "โปรตีนสูง"],
  },
  {
    id: "sn-milk-apple",
    name: "นมจืด 1 กล่อง + แอปเปิล",
    slot: "snack",
    equipment: ["ไม่ต้องปรุง"],
    ingredients: [
      { name: "นมจืด", grams: 250 },
      { name: "แอปเปิล", grams: 150 },
    ],
    steps: ["ดื่มนมจืด 1 กล่อง + กินแอปเปิล 1 ลูก", "เบา ๆ ก่อนคาร์ดิโอ"],
    benefit:
      "นมให้โปรตีน+แคลเซียม แอปเปิลให้คาร์บเบา ๆ + ไฟเบอร์ ของว่างไม่หนักท้องก่อนออกกำลัง",
    tags: ["ก่อนเล่น"],
  },

  // ── มื้อเย็น ──
  {
    id: "dn-yogurt",
    name: "กรีกโยเกิร์ต + ผลไม้ + ไข่ต้ม 3 ฟอง",
    slot: "dinner",
    equipment: ["เครื่องต้มไข่", "ไม่ต้องปรุง"],
    ingredients: [
      { name: "กรีกโยเกิร์ต", grams: 200 },
      { name: "แอปเปิล", grams: 150 },
      { name: "กล้วยหอม", grams: 100 },
      { name: "ไข่ไก่", grams: 150 },
    ],
    steps: [
      "ต้มไข่ 3 ฟองในเครื่องต้มไข่",
      "ตักกรีกโยเกิร์ตใส่ถ้วย ใส่ผลไม้หั่นชิ้น (กล้วย + แอปเปิล)",
      "กินคู่ไข่ต้ม เบาท้องก่อนนอน",
    ],
    benefit:
      "มื้อเย็นเบาท้องก่อนนอน กรีกโยเกิร์ต+ไข่ให้โปรตีนซ่อมกล้ามตอนหลับ ผลไม้ให้วิตามิน",
    tags: ["โปรตีนสูง"],
  },
  {
    id: "dn-chicken",
    name: "ข้าวกล้อง + อกไก่ทอดกระทะ + ผัก (อุ่นจากกล่องก็ได้)",
    slot: "dinner",
    equipment: ["กระทะไฟฟ้า", "ไมโครเวฟ"],
    ingredients: [
      { name: "ข้าวกล้อง", grams: 180 },
      { name: "อกไก่", grams: 200 },
      { name: "ผักรวมแช่แข็ง", grams: 120 },
      { name: "น้ำมันรำข้าว", grams: 5 },
    ],
    steps: [
      "อุ่นอกไก่กล่องที่ทำไว้ตอนกลางวัน ไมโครเวฟ 2 นาที (หรือทอดสดในกระทะ 4–5 นาที/ด้าน)",
      "ตักข้าวกล้อง ~180 ก. อุ่นไมโครเวฟ 1–2 นาที",
      "อุ่นผักไมโครเวฟ 2 นาที — มื้อหลังคาร์ดิโอ เติมข้าวพอประมาณช่วยฟื้นกล้าม",
    ],
    benefit:
      "มื้อเย็นโปรตีนสูง + ข้าวพอประมาณเติมพลังหลังคาร์ดิโอ ช่วยฟื้นกล้ามคืนนี้",
    tags: ["หลังเล่น = ซ่อมกล้าม"],
  },
];
```

- [ ] **Step 3: เพิ่มเทสต์ `recipeMacros` ใน `src/lib/nutrition.test.ts`**

เพิ่ม import และ describe block:

```ts
import { recipeMacros } from "./nutrition";
import { getRecipe } from "./meals";
```

```ts
describe("recipeMacros", () => {
  it("ln-chicken = 624/55/71/11 (ปัดเศษ)", () => {
    const r = getRecipe("ln-chicken")!;
    expect(recipeMacros(r)).toEqual({ kcal: 624, protein: 55, carb: 71, fat: 11 });
  });

  it("po-whey-rice โปรตีนสูง (≈ 72 ก.)", () => {
    const r = getRecipe("po-whey-rice")!;
    expect(recipeMacros(r).protein).toBe(72);
  });
});
```

- [ ] **Step 4: รันเทสต์ ให้ fail**

Run: `bun test src/lib/nutrition.test.ts`
Expected: FAIL — `recipeMacros is not a function` (ยังไม่ได้เพิ่ม)

- [ ] **Step 5: เพิ่ม `recipeMacros` ใน `src/lib/nutrition.ts`**

เพิ่ม import type `Recipe` และฟังก์ชัน (วางต่อจาก `sumMacros`):

```ts
import type { DayType, Macros, Profile, Recipe } from "@/data/types";
```

```ts
/** มาโครรวมของเมนู (ปัดเศษเป็นจำนวนเต็มทุกฟิลด์) */
export function recipeMacros(recipe: Recipe): Macros {
  const total = sumMacros(
    recipe.ingredients.map((i) => macrosOf(i.name, i.grams))
  );
  return {
    kcal: Math.round(total.kcal),
    protein: Math.round(total.protein),
    carb: Math.round(total.carb),
    fat: Math.round(total.fat),
  };
}
```

- [ ] **Step 6: อัปเดต `src/lib/shopping.ts` ให้อ่าน `.name`**

ใน `computeShoppingItems` แก้บรรทัด forEach:

```ts
// เดิม: getRecipe(id)?.ingredients.forEach((n) => names.add(n));
getRecipe(id)?.ingredients.forEach((i) => names.add(i.name));
```

- [ ] **Step 7: อัปเดต `src/lib/meals.ts` ให้ `resolveMeal` พ่วง macros + benefit**

เพิ่มแค่บรรทัด import `recipeMacros` (ไม่แตะ import เดิมที่อ้าง `@/data/types`):

```ts
import { recipeMacros } from "./nutrition";
```

> หมายเหตุ: `meals.ts` อยู่ใน `src/lib` — type ต่าง ๆ ยัง import จาก `@/data/types` ตามเดิม เพิ่มเฉพาะ `recipeMacros` จาก `./nutrition`

ใน `resolveMeal` แก้ object ที่ return ให้เพิ่ม `macros` + `benefit`:

```ts
const ZERO_MACROS = { kcal: 0, protein: 0, carb: 0, fat: 0 } as const;

export function resolveMeal(
  dayKey: string,
  index: number,
  dm: DayMeal,
  swaps: Record<string, string>
): Meal {
  const id = resolveRecipeId(dayKey, index, dm, swaps);
  const recipe = recipeById.get(id);
  return {
    time: dm.time,
    name: MEAL_SLOT_LABEL[dm.slot],
    menu: recipe?.name ?? "(ไม่พบเมนู)",
    recipeId: recipe?.id ?? dm.recipeId,
    slot: dm.slot,
    equipment: recipe?.equipment,
    steps: recipe?.steps ?? [],
    tags: dm.tags ?? recipe?.tags ?? [],
    macros: recipe ? recipeMacros(recipe) : { ...ZERO_MACROS },
    benefit: recipe?.benefit ?? "",
  };
}
```

- [ ] **Step 8: อัปเดต fixture ใน `src/lib/meals.test.ts`**

ใน describe `buildShoppingItems` เพิ่ม `macrosPer100g` ให้ทุก item ของ `catalog` และ `pantry` (type ใหม่บังคับ):

```ts
const catalog: CatalogItem[] = [
  { name: "ไข่", qty: "30", price: 140, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 143, protein: 12.6, carb: 0.7, fat: 9.5 } },
  { name: "ข้าว", qty: "5กก", price: 250, category: "คาร์บ", recurring: true, macrosPer100g: { kcal: 130, protein: 2.7, carb: 28, fat: 0.3 } },
];
const pantry: CatalogItem[] = [
  { name: "น้ำมัน", qty: "1", price: 200, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 884, protein: 0, carb: 0, fat: 100 } },
];
```

- [ ] **Step 9: รันเทสต์ทั้งหมด ให้ผ่าน**

Run: `bun test src/lib`
Expected: PASS ทั้งหมด (nutrition + meals + shopping + cost + timeline)

- [ ] **Step 10: ตรวจ type ทั้งแอป**

Run: `bun run build`
Expected: build สำเร็จ (ไม่มี type error) — `menu-library-view.tsx` ยังใช้ `recipe.ingredients.join(...)` ซึ่งจะ error เพราะตอนนี้เป็น `RecipeItem[]`

> ⚠️ ถ้า build error ที่ `menu-library-view.tsx` (`.join` บน object) ให้แก้ชั่วคราวในขั้นนี้ให้ผ่านก่อน โดยเปลี่ยนเป็น:
> ```tsx
> {recipe.ingredients.map((i) => `${i.name} ${i.grams} ก.`).join(" · ")}
> ```
> (Task 4 จะปรับการแสดงผลตัวนี้อีกที — แต่ต้องให้ build เขียวก่อน commit)

- [ ] **Step 11: Commit**

```bash
git add src/data/types.ts src/data/recipes.ts src/lib/nutrition.ts src/lib/nutrition.test.ts src/lib/meals.ts src/lib/shopping.ts src/lib/meals.test.ts src/components/views/menu-library-view.tsx
git commit -m "feat(nutrition): recipes carry grams+benefit, auto-compute macros"
```

---

## Task 3: Rebalance the week to targets (guarded by a balance test)

ปรับ `week.ts` ให้แต่ละวันเข้าเป้า: วันพักเพิ่มของว่าง (4 มื้อ) + วันอาทิตย์เปลี่ยนเช้าเป็นขนมปัง แล้วล็อกด้วยเทสต์

**Files:**
- Modify: `src/data/week.ts`
- Test: `src/lib/nutrition.test.ts` (+ เทสต์สมดุลทั้งสัปดาห์)

**Interfaces:**
- Consumes: `resolveDay` (มี `meals[].macros` แล้ว), `sumMacros`, `dailyTarget`

- [ ] **Step 1: เขียนเทสต์สมดุล ให้ fail ก่อนแก้ week.ts**

เพิ่มใน `src/lib/nutrition.test.ts`:

```ts
import { week } from "@/data/week";
import { resolveDay } from "./meals";

describe("สมดุลทั้งสัปดาห์ — แต่ละวันใกล้เป้า", () => {
  for (const day of week) {
    it(`${day.label}: kcal อยู่ใน ±6% และโปรตีน ≥ 145 ก.`, () => {
      const rd = resolveDay(day, {});
      const total = sumMacros(rd.meals.map((m) => m.macros));
      const target = dailyTarget(profile, day.type);
      expect(total.kcal).toBeGreaterThanOrEqual(target.kcal * 0.94);
      expect(total.kcal).toBeLessThanOrEqual(target.kcal * 1.06);
      expect(total.protein).toBeGreaterThanOrEqual(145);
    });
  }
});
```

- [ ] **Step 2: รันเทสต์**

Run: `bun test src/lib/nutrition.test.ts`
Expected: FAIL ที่วัน เสาร์/อาทิตย์ (ตอนนี้มีแค่ 3 มื้อ โปรตีน < 145, kcal ต่ำกว่า −6%)

- [ ] **Step 3: แก้วันพักใน `src/data/week.ts`**

แทนที่บล็อก `sat` `meals` (เพิ่มของว่าง 16:00):

```ts
    meals: [
      { time: "08:00", slot: "breakfast", recipeId: "bf-bread" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "18:30", slot: "dinner", recipeId: "dn-yogurt" },
    ],
```

แทนที่บล็อก `sun` `meals` (เปลี่ยนเช้า bf-oat → bf-bread + เพิ่มของว่าง):

```ts
    meals: [
      { time: "08:00", slot: "breakfast", recipeId: "bf-bread" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "18:30", slot: "dinner", recipeId: "dn-yogurt" },
    ],
```

- [ ] **Step 4: รันเทสต์ ให้ผ่าน**

Run: `bun test src/lib`
Expected: PASS ทุกวัน

> ผลรวมที่คาด (อ้างอิง): จ 2103/162 · อ 1996/161 · พ 2146/168 · พฤ 1972/148 · ศ 2103/162 · ส 1926/147 · อา 1926/147 (kcal/โปรตีน)

- [ ] **Step 5: Commit**

```bash
git add src/data/week.ts src/lib/nutrition.test.ts
git commit -m "feat(menu): rebalance week to per-day macro targets"
```

---

## Task 4: NutritionStrip — แสดงมาโคร+ประโยชน์ในการ์ดมื้อ + คลังเมนู

**Files:**
- Create: `src/components/nutrition-strip.tsx`
- Modify: `src/components/meal-card.tsx`
- Modify: `src/components/views/menu-library-view.tsx`

**Interfaces:**
- Consumes: `Meal.macros`, `Meal.benefit`, `recipeMacros`
- Produces: `<NutritionStrip macros={...} />`

- [ ] **Step 1: สร้าง `src/components/nutrition-strip.tsx`**

```tsx
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
```

- [ ] **Step 2: ใส่ใน `src/components/meal-card.tsx`**

เพิ่ม import:

```tsx
import { Repeat, Check, Sparkles } from "lucide-react";
import { NutritionStrip } from "@/components/nutrition-strip";
```

วาง `<NutritionStrip>` + บรรทัด benefit หลัง `<EquipmentBadges />` และก่อน `<StepList>`:

```tsx
      <EquipmentBadges equipment={meal.equipment} />
      <NutritionStrip macros={meal.macros} />
      {meal.benefit && (
        <p className="mt-2 flex gap-1.5 text-xs leading-snug text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{meal.benefit}</span>
        </p>
      )}
      <StepList steps={meal.steps} />
```

- [ ] **Step 3: ใส่ใน `src/components/views/menu-library-view.tsx`**

เพิ่ม import:

```tsx
import { Info, Sparkles } from "lucide-react";
import { recipes } from "@/data";
import { recipeMacros } from "@/lib/nutrition";
import { NutritionStrip } from "@/components/nutrition-strip";
```

แก้ `RecipeCard` ให้คำนวณมาโคร + แสดง strip/benefit + กรัมวัตถุดิบ:

```tsx
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
```

- [ ] **Step 4: ตรวจ build + เทสต์**

Run: `bun run build`
Expected: build สำเร็จ ไม่มี type error

Run: `bun test src/lib`
Expected: PASS

- [ ] **Step 5: ตรวจด้วยตา (preview)**

เปิด dev server แล้วดูแท็บ 🍱 อาหาร และแท็บ 📖 เมนู:
- การ์ดแต่ละมื้อมีแถบ `xxx kcal · P · C · F` + บรรทัด ✨ ประโยชน์
- คลังเมนูแสดงวัตถุดิบพร้อมกรัม + มาโคร
- กดสลับเมนู → แถบมาโคร/ประโยชน์เปลี่ยนตามเมนูใหม่

- [ ] **Step 6: Commit**

```bash
git add src/components/nutrition-strip.tsx src/components/meal-card.tsx src/components/views/menu-library-view.tsx
git commit -m "feat(ui): nutrition strip + benefit in meal cards and menu library"
```

---

## Task 5: DailyNutritionSummary — กล่องสรุปวัน vs เป้า บนแท็บอาหาร

**Files:**
- Create: `src/components/daily-nutrition-summary.tsx`
- Modify: `src/components/views/meal-view.tsx`

**Interfaces:**
- Consumes: `ResolvedDay` (`meals[].macros`, `type`), `profile`, `sumMacros`, `dailyTarget`
- Produces: `<DailyNutritionSummary total={...} target={...} />`

- [ ] **Step 1: สร้าง `src/components/daily-nutrition-summary.tsx`**

```tsx
import type { Macros } from "@/data/types";
import { cn } from "@/lib/utils";

/** แถบ progress 1 ตัว (value/target) */
function Bar({ value, target, warnOver }: { value: number; target: number; warnOver: boolean }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const off = warnOver ? value > target : value < target;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", off ? "bg-amber-500" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  target,
  unit,
  warnOver,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  warnOver: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tnum text-muted-foreground">
          <span className="font-semibold text-foreground">{value}</span> / {target} {unit}
        </span>
      </div>
      <div className="mt-1">
        <Bar value={value} target={target} warnOver={warnOver} />
      </div>
    </div>
  );
}

/** สรุปโภชนาการรวมของวัน เทียบเป้า (kcal + โปรตีน เป็นแถบ, C/F เป็นตัวเลข) */
export function DailyNutritionSummary({ total, target }: { total: Macros; target: Macros }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-bold">สรุปวันนี้ เทียบเป้า</h3>
      <div className="mt-3 space-y-3">
        <Row label="แคลอรี่" value={total.kcal} target={target.kcal} unit="kcal" warnOver />
        <Row label="โปรตีน" value={total.protein} target={target.protein} unit="ก." warnOver={false} />
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="tnum">
          คาร์บ <span className="font-semibold text-foreground">{total.carb}</span> / {target.carb} ก.
        </span>
        <span className="tnum">
          ไขมัน <span className="font-semibold text-foreground">{total.fat}</span> / {target.fat} ก.
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ใส่ใน `src/components/views/meal-view.tsx`**

เพิ่ม import:

```tsx
import { profile } from "@/data";
import { sumMacros, dailyTarget } from "@/lib/nutrition";
import { DailyNutritionSummary } from "@/components/daily-nutrition-summary";
```

ในตัวฟังก์ชัน คำนวณ total/target และวางกล่องสรุปไว้บนสุด (ก่อนกล่องน้ำดื่ม):

```tsx
  const total = sumMacros(day.meals.map((m) => m.macros));
  const target = dailyTarget(profile, day.type);
```

```tsx
  return (
    <div className="space-y-4 px-4 py-4">
      <DailyNutritionSummary total={total} target={target} />

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
        {/* ...กล่องน้ำดื่มเดิม... */}
```

- [ ] **Step 3: ตรวจ build + เทสต์**

Run: `bun run build`
Expected: build สำเร็จ

Run: `bun test src/lib`
Expected: PASS ทั้งหมด

- [ ] **Step 4: ตรวจด้วยตา (preview)**

แท็บ 🍱 อาหาร:
- บนสุดมีกล่อง "สรุปวันนี้ เทียบเป้า" — แถบ kcal + โปรตีน, ตัวเลข C/F
- เลือกวันเล่นเวต/คาร์ดิโอ/พัก → เป้าเปลี่ยนตามชนิดวัน
- สลับเมนูในมื้อ → ตัวเลขรวมในกล่องสรุปอัปเดตทันที
- โปรตีนแตะ ~150 ก., แคลอรี่ใกล้เป้า (แถบเต็มใกล้ 100%)

- [ ] **Step 5: Commit**

```bash
git add src/components/daily-nutrition-summary.tsx src/components/views/meal-view.tsx
git commit -m "feat(ui): daily nutrition summary vs target on meal tab"
```

---

## Self-Review (ผู้เขียนแผนตรวจเองแล้ว)

**Spec coverage:**
- โภชนาการตัวเลขครบ → Task 1 (มาโครวัตถุดิบ) + Task 2 (recipeMacros) + Task 4/5 (แสดง) ✓
- ประโยชน์/ช่วยอะไร → Task 2 (`benefit` ทุกเมนู) + Task 4/5 (แสดง) ✓
- จัดเข้าเป้าต่อวันตามชนิดวัน → Task 1 (`dailyTarget`) + Task 3 (rebalance + เทสต์) ✓
- แสดง 3 จุด (การ์ดมื้อ/คลังเมนู/สรุปต่อวัน) → Task 4 + Task 5 ✓
- ประหยัด + มือใหม่ + Makro → Global Constraints (ไม่เพิ่มของใหม่ ใช้ catalog เดิม) ✓
- ไม่ทำของหวาน → ไม่มี task ของหวาน ✓

**Placeholder scan:** ไม่มี TBD/TODO — โค้ดครบทุก step ✓

**Type consistency:** `Macros`, `RecipeItem`, `macrosOf`, `recipeMacros`, `sumMacros`, `dailyTarget`, `Meal.macros/benefit`, `Recipe.ingredients/benefit`, `CatalogItem.macrosPer100g`, `Profile.weightKg` — ใช้ชื่อ/ลายเซ็นตรงกันทุก task ✓
