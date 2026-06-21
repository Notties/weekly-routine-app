# Tier 4A — คอนเทนต์อาหาร: ของหวาน healthy + เมนูหลากหลาย + ฟิลเตอร์คลัง

วันที่: 2026-06-21
สถานะ: รออนุมัติ

## เป้าหมาย

ต่อยอดระบบ recipe+มาโคร (Tier 0) ด้วยคอนเทนต์อาหาร 3 ส่วน:

1. **ของหวาน healthy** — slot ใหม่ `"dessert"` 5 เมนู (มือใหม่ทำได้ + Makro + มาโครคำนวณเอง) เปิดดู/ทำได้ในคลังเมนู ไม่ยัดในแผนรายวัน
2. **เมนูหลากหลายขึ้น** — เพิ่มตัวเลือกสลับ ~4 เมนู (เช้า/กลางวัน/ว่าง/เย็น) ให้สลับกันไม่เบื่อ
3. **ฟิลเตอร์คลังเมนู** — แถบชิปกรองตามแท็ก/ชนิด/อุปกรณ์

ขอบเขตที่ **ไม่ทำ** รอบนี้: ของหวานไม่นับรวมมาโครรายวัน (ของแถมตามใจ ไม่อยู่ใน week.ts), ฟอร์มท่า/progression (สเปค B), ฟิลเตอร์เลือกได้ทีละชิป (ไม่ทำ multi-select)

## หลักการ

ใช้สถาปัตยกรรม [recipe-library-architecture] เดิม: เพิ่มเมนูใน `recipes.ts` (ingredients เป็น `{name,grams}` อ้างชื่อจาก `ingredients.ts`) → มาโครคำนวณเอง ของหวาน/เมนูใหม่โผล่ในคลังทันที วัตถุดิบใหม่ต้องเพิ่มใน catalog พร้อม `macrosPer100g` มิฉะนั้น `recipeMacros` คิดเป็น 0

## 1) Slot ของหวาน + 5 เมนู

- `types.ts`: เพิ่ม `"dessert"` ใน `MealSlot` + `MEAL_SLOT_LABEL["dessert"] = "ของหวาน"`
- `menu-library-view.tsx`: เพิ่ม `"dessert"` ใน `SLOT_ORDER` (ท้ายสุด)
- ของหวานมี `slot: "dessert"` — **ไม่อยู่ใน week.ts** จึงไม่ swappable ไม่เข้ารายการซื้อของอัตโนมัติ (โชว์ในคลังอย่างเดียว) "กินตอนไหน" เขียนในบรรทัด `benefit`

5 เมนู (กรัม + อุปกรณ์):

| id | ชื่อ | วัตถุดิบ (กรัม) | อุปกรณ์ | มาโคร (อ้างอิง kcal/P/C/F) |
|---|---|---|---|---|
| dst-yogurt-bowl | กรีกโยเกิร์ตโบว์ล + กล้วย + อัลมอนด์ | กรีกโยเกิร์ต 150 · กล้วยหอม 80 · อัลมอนด์ 15 | ไม่ต้องปรุง | ~248/19/28/9 |
| dst-nicecream | ไอศกรีมกล้วยโกโก้ (บด/ปั่น) | กล้วยหอม 150 · ผงโกโก้ 5 · นมจืด 30 | ไม่ต้องปรุง | ~163/4/39/2 |
| dst-mugcake | เค้กโกโก้ถ้วยไมโครเวฟ | ข้าวโอ๊ต 30 · ผงโกโก้ 8 · ไข่ไก่ 50 · นมจืด 40 · กล้วยหอม 50 | ไมโครเวฟ | ~272/14/39/9 |
| dst-protein-mousse | มูสโปรตีนโกโก้ | กรีกโยเกิร์ต 150 · เวย์โปรตีน 15 · ผงโกโก้ 5 | ไม่ต้องปรุง | ~161/28/10/2 |
| dst-apple-cinnamon | แอปเปิลอบอบเชยไมโครเวฟ + อัลมอนด์ | แอปเปิล 150 · อบเชย 1 · ข้าวโอ๊ต 15 · อัลมอนด์ 10 | ไมโครเวฟ | ~195/5/34/6 |

> มาโครเป็นค่าโดยประมาณ — ระบบคำนวณจริงจาก grams × `macrosPer100g` (เลขในตารางไว้ตรวจสอบ)

## 2) วัตถุดิบใหม่ใน catalog (พร้อม macrosPer100g)

| name | qty (Makro) | price | category | recurring | macrosPer100g (kcal/P/C/F) |
|---|---|--:|---|---|---|
| ผงโกโก้ | ผงโกโก้แท้ไม่ใส่น้ำตาล 1 กระปุก | 90 | เครื่องปรุง | true | 230 / 20 / 58 / 14 |
| อบเชย | อบเชยป่น 1 ขวดเล็ก | 35 | เครื่องปรุง | true | 247 / 4 / 81 / 1 |

(ของหวานที่เหลือใช้วัตถุดิบเดิม: กรีกโยเกิร์ต/กล้วย/อัลมอนด์/นม/โอ๊ต/ไข่/เวย์/แอปเปิล)

## 3) เมนูหลากหลาย (~4 ตัวเลือกสลับใหม่)

| id | slot | ชื่อ | วัตถุดิบ (กรัม) | อุปกรณ์ | tags |
|---|---|---|---|---|---|
| bf-yogurt-oat | breakfast | กรีกโยเกิร์ต + โอ๊ต + กล้วย + อัลมอนด์ | กรีกโยเกิร์ต 150 · ข้าวโอ๊ต 40 · กล้วยหอม 80 · อัลมอนด์ 15 | ไม่ต้องปรุง | โปรตีนสูง, ทำเร็ว, ไม่มีเนื้อสัตว์ |
| ln-eggrice | lunch | ข้าวกล้อง + ไข่ต้ม 3 ฟอง + ผัก (ไม่ใช้กระทะ) | ข้าวกล้อง 220 · ไข่ไก่ 150 · ผักรวมแช่แข็ง 120 | หม้อหุงข้าว, เครื่องต้มไข่, ไมโครเวฟ | ไม่มีเนื้อสัตว์ |
| sn-boiled-egg | snack | ไข่ต้ม 2 ฟอง + แอปเปิล | ไข่ไก่ 100 · แอปเปิล 150 | เครื่องต้มไข่ | โปรตีนสูง, ก่อนเล่น |
| dn-eggveg | dinner | ไข่ต้ม 3 ฟอง + ผัก + แอปเปิล (เบาแป้ง) | ไข่ไก่ 150 · ผักรวมแช่แข็ง 120 · แอปเปิล 150 | เครื่องต้มไข่, ไมโครเวฟ | ไม่มีเนื้อสัตว์ |

ทุกเมนูมี `benefit` (ให้อะไร/ช่วยอะไร) ตามแบบเดิม เมนูเหล่านี้เป็นตัวเลือกสลับใน slot เดียวกัน (โผล่ในปุ่ม "สลับ" + คลังเมนูทันที)

## 4) ฟิลเตอร์คลังเมนู

- `lib/recipe-filter.ts` (ใหม่): นิยามชิปแบบ **predicate** (กันแท็กไม่ตรงเป๊ะ) + ฟังก์ชันกรองบริสุทธิ์

```ts
export type RecipeFilter = { id: string; label: string; match: (r: Recipe) => boolean };

export const RECIPE_FILTERS: RecipeFilter[] = [
  { id: "protein", label: "โปรตีนสูง", match: (r) => !!r.tags?.includes("โปรตีนสูง") },
  { id: "fast", label: "ทำเร็ว", match: (r) => !!r.tags?.includes("ทำเร็ว") },
  { id: "nomeat", label: "ไม่มีเนื้อสัตว์", match: (r) => !!r.tags?.includes("ไม่มีเนื้อสัตว์") },
  { id: "pre", label: "ก่อนเล่น", match: (r) => r.slot === "preworkout" || !!r.tags?.includes("ก่อนเล่น") },
  { id: "post", label: "หลังเล่น", match: (r) => r.slot === "postworkout" },
  { id: "dessert", label: "ของหวาน", match: (r) => r.slot === "dessert" },
  { id: "nopan", label: "ไม่ต้องใช้กระทะ", match: (r) => !r.equipment.includes("กระทะไฟฟ้า") },
];

/** filterId = null → ทั้งหมด */
export function filterRecipes(recipes: Recipe[], filterId: string | null): Recipe[];
```

- `menu-library-view.tsx` → **client component** (`"use client"`): state `activeFilter: string | null`; แถวชิปแนวนอน (`[ทั้งหมด]` + ชิปจาก `RECIPE_FILTERS`); ใช้ `filterRecipes` แล้วค่อยจัดหมวดตาม `SLOT_ORDER` (รวม dessert), ซ่อนหมวดที่ว่าง; ใช้สไตล์ชิปเดิม (border/rounded/bg-muted)

## ไฟล์ที่แตะ

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/data/types.ts` | + `"dessert"` ใน `MealSlot` + `MEAL_SLOT_LABEL` |
| `src/data/ingredients.ts` | + ผงโกโก้, อบเชย (พร้อม macrosPer100g) |
| `src/data/recipes.ts` | + 5 ของหวาน + 4 เมนูสลับ (grams + benefit + tags) |
| `src/lib/recipe-filter.ts` (ใหม่) | `RECIPE_FILTERS` + `filterRecipes` |
| `src/lib/recipe-filter.test.ts` (ใหม่) | เทสต์ filterRecipes + referential integrity |
| `src/components/views/menu-library-view.tsx` | client + แถบชิปฟิลเตอร์ + dessert section |

## การทดสอบ / ตรวจรับ

- **TDD** `recipe-filter.test.ts`:
  - `filterRecipes(recipes, null)` คืนทั้งหมด
  - `filterRecipes(recipes, "dessert")` คืนเฉพาะ slot dessert (5 เมนู)
  - `filterRecipes(recipes, "nopan")` ไม่มีเมนูที่ใช้กระทะไฟฟ้า
  - `filterRecipes(recipes, "nomeat")` ทุกเมนูมีแท็ก "ไม่มีเนื้อสัตว์"
  - **Referential integrity**: ทุก `ingredients[].name` ของทุก recipe มีใน `ingredientCatalog` ∪ `pantryStaples` (กันพิมพ์ผิด/วัตถุดิบใหม่ที่ลืมเพิ่ม)
- `bun test src/lib` เขียวทั้งหมด (รวมเทสต์เดิม — เพิ่ม dessert ไม่กระทบ week balance เพราะไม่อยู่ใน week.ts) · `bun run build` ผ่าน
- ตรวจเบราว์เซอร์: แท็บเมนูมีหมวด "ของหวาน" 5 เมนู (มีมาโคร+ประโยชน์); ชิปฟิลเตอร์กดแล้วกรองถูก + ซ่อนหมวดว่าง; เมนูสลับใหม่โผล่ในปุ่ม "สลับ" ของ slot ที่เกี่ยว
