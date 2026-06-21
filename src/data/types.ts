// ───────────────────────────────────────────────────────────
// โมเดลข้อมูลทั้งหมดของแอป — แก้ไข/เพิ่ม/ลด เนื้อหาได้ที่ไฟล์ data ข้าง ๆ
// ───────────────────────────────────────────────────────────

/** มาโคร: แคลอรี่ + โปรตีน/คาร์บ/ไขมัน (กรัม) */
export type Macros = {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
};

/** วัตถุดิบในเมนู: ชื่อ (อ้าง catalog) + กรัมที่ใช้จริงต่อ 1 ที่ */
export type RecipeItem = { name: string; grams: number };

export type DayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

/** ประเภทของวัน: เล่นเวต / คาร์ดิโอ / พัก */
export type DayType = "weights" | "cardio" | "rest";

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

export type Exercise = {
  name: string;
  /** กล้ามเนื้อหลักที่ใช้ */
  muscle: string;
  sets: number;
  /** จำนวนครั้ง (string เพื่อรองรับ "8-12", "AMRAP", "30 วิ") */
  reps: string;
  /** เวลาพักระหว่างเซ็ต เช่น "90 วิ" */
  rest: string;
};

/** อุปกรณ์ครัวที่ใช้ (จำกัดตามที่มีจริง) */
export type Appliance =
  | "กระทะไฟฟ้า"
  | "ไมโครเวฟ"
  | "เครื่องต้มไข่"
  | "หม้อหุงข้าว"
  | "ไม่ต้องปรุง";

/** หมวดมื้อ — ใช้กรองเมนูตอนสลับ (สลับได้เฉพาะเมนูหมวดเดียวกัน) */
export type MealSlot =
  | "breakfast"
  | "lunch"
  | "preworkout"
  | "postworkout"
  | "snack"
  | "dinner";

/** ป้ายไทยของแต่ละหมวดมื้อ */
export const MEAL_SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "มื้อเช้า",
  lunch: "มื้อกลางวัน",
  preworkout: "ก่อนเล่น",
  postworkout: "หลังเล่น",
  snack: "ของว่าง",
  dinner: "มื้อเย็น",
};

/**
 * เมนูในคลัง (recipe library) — มีวิธีทำ + วัตถุดิบติดมาด้วย
 * เพิ่มเมนูใหม่ได้ที่ src/data/recipes.ts (วัตถุดิบอ้างชื่อจาก ingredients.ts)
 */
export type Recipe = {
  id: string;
  /** ชื่อเมนู/จานอาหาร เช่น "ข้าวกล้อง + อกไก่ทอดกระทะ + ผัก" */
  name: string;
  /** หมวดมื้อ (สลับได้เฉพาะเมนูหมวดเดียวกัน) */
  slot: MealSlot;
  /** อุปกรณ์ที่ต้องใช้ */
  equipment: Appliance[];
  /** วัตถุดิบ + กรัมต่อ 1 ที่ (อ้างอิง ingredientCatalog/pantryStaples) */
  ingredients: RecipeItem[];
  /** ขั้นตอนวิธีทำแบบมือใหม่ทำตามได้ */
  steps: string[];
  /** ประโยชน์: เมนูนี้ให้อะไร/ช่วยอะไร */
  benefit: string;
  /** ป้ายกำกับเริ่มต้น เช่น "โปรตีนสูง" */
  tags?: string[];
};

/** ช่องมื้อในแต่ละวัน — ชี้ไปยังเมนูในคลังด้วย recipeId */
export type DayMeal = {
  /** เวลา "HH:MM" */
  time: string;
  slot: MealSlot;
  /** เมนูเริ่มต้นของช่องนี้ (id จากคลังเมนู) */
  recipeId: string;
  /** ป้ายกำกับเฉพาะช่องนี้ เช่น "ก่อนเล่น", "หลังเล่น = ซ่อมกล้าม" (ทับของเมนู) */
  tags?: string[];
};

/** มื้อที่ resolve แล้วพร้อมแสดงผล (รวมข้อมูลจากเมนูที่เลือก) */
export type Meal = {
  /** เวลา "HH:MM" */
  time: string;
  /** ป้ายมื้อ เช่น "มื้อเช้า" */
  name: string;
  /** ชื่อเมนูที่เลือก */
  menu: string;
  /** id ของเมนูที่กำลังใช้ (ไว้ทำปุ่มสลับ) */
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

export type Workout = {
  time: { start: string; end: string };
  warmup: string[];
  exercises: Exercise[];
  cooldown: string[];
};

export type Sleep = {
  /** เวลาเข้านอน "HH:MM" */
  bedtime: string;
  /** เวลาตื่น "HH:MM" */
  wake: string;
  /** จำนวนชั่วโมงที่นอน */
  hours: number;
  /** โน้ตของวันนั้น */
  note: string;
};

export type Day = {
  key: DayKey;
  /** ชื่อวันเต็ม เช่น "จันทร์" */
  label: string;
  /** ชื่อย่อ เช่น "จ" */
  short: string;
  type: DayType;
  /** ชื่อโปรแกรมของวัน เช่น "Full Body A" / "คาร์ดิโอ" / "วันพัก" */
  title: string;
  /** ไม่มีในวันพัก */
  workout?: Workout;
  /** ช่องมื้อของวัน (ชี้ไปคลังเมนู) */
  meals: DayMeal[];
  sleep: Sleep;
};

/** วันที่ resolve เมนูแล้ว (meals เป็น Meal พร้อมแสดง) — ใช้ในหน้าจอ */
export type ResolvedDay = Omit<Day, "meals"> & { meals: Meal[] };

export type ShopCategory =
  | "โปรตีน"
  | "คาร์บ"
  | "ผัก"
  | "ผลไม้"
  | "ไขมันดี"
  | "เครื่องปรุง";

export type ShopItem = {
  name: string;
  /** ปริมาณ เช่น "1 กก." */
  qty: string;
  /** ราคา (บาท) */
  price: number;
  category: ShopCategory;
  /** true = ของซื้อครั้งเดียวใช้ได้นาน (ข้าว/น้ำมัน/เครื่องปรุง) */
  recurring: boolean;
};

/**
 * รายการในคลังวัตถุดิบ (ingredient catalog) — ราคาต่อสัปดาห์ + มาโครต่อ 100 ก.
 * รายการซื้อของจะหยิบเฉพาะวัตถุดิบที่เมนูในสัปดาห์นั้นใช้จริง
 */
export type CatalogItem = ShopItem & {
  /** มาโครต่อวัตถุดิบ 100 กรัม — ใช้คำนวณโภชนาการของเมนู */
  macrosPer100g: Macros;
};

/** ลำดับหมวดที่จะแสดงในแท็บซื้อของ */
export const SHOP_CATEGORIES: ShopCategory[] = [
  "โปรตีน",
  "คาร์บ",
  "ผัก",
  "ผลไม้",
  "ไขมันดี",
  "เครื่องปรุง",
];

/** วันที่รูปแบบ "YYYY-MM-DD" (เวลาท้องถิ่น) */
export type ISODate = string;

/** บันทึกของวันหนึ่ง */
export type DayLog = {
  weightKg?: number;
  /** index มื้อที่ติ๊กว่าทำแล้ว */
  meals?: Record<number, true>;
  workoutDone?: boolean;
  waterMl?: number;
};

/** ค่าโปรไฟล์ที่ผู้ใช้แก้เอง (น้ำหนักไม่อยู่ที่นี่ — อยู่ใน log) */
export type ProfileOverride = Partial<
  Pick<Profile, "goal" | "heightCm" | "age" | "workoutWindow">
>;
