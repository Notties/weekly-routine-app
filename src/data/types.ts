// ───────────────────────────────────────────────────────────
// โมเดลข้อมูลทั้งหมดของแอป — แก้ไข/เพิ่ม/ลด เนื้อหาได้ที่ไฟล์ data ข้าง ๆ
// ───────────────────────────────────────────────────────────

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

export type Meal = {
  /** เวลา รูปแบบ "HH:MM" */
  time: string;
  /** ชื่อมื้อ เช่น "มื้อเช้า" */
  name: string;
  /** เมนู */
  menu: string;
  /** อุปกรณ์ที่ต้องใช้ทำมื้อนี้ */
  equipment?: Appliance[];
  /** ขั้นตอนวิธีทำสั้น ๆ 1-2-3 (เขียนแบบมือใหม่ทำตามได้) */
  steps: string[];
  /** ป้ายกำกับ เช่น "ก่อนเล่น", "หลังเล่น = ซ่อมกล้าม" */
  tags: string[];
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
  meals: Meal[];
  sleep: Sleep;
};

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

/** ลำดับหมวดที่จะแสดงในแท็บซื้อของ */
export const SHOP_CATEGORIES: ShopCategory[] = [
  "โปรตีน",
  "คาร์บ",
  "ผัก",
  "ผลไม้",
  "ไขมันดี",
  "เครื่องปรุง",
];
