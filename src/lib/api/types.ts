import type { DayLog, ISODate, ProfileOverride, SetEntry } from "@/data/types";

/** ส่วนของ state ที่ persist ขึ้น backend (UI-local เช่น selectedDay ไม่รวม) */
export type SyncSlice = {
  swaps: Record<string, string>;
  checked: Record<string, boolean>;
  log: Record<ISODate, DayLog>;
  profileOverride: ProfileOverride;
};

/** row ดิบจาก Prisma (เฉพาะ field ที่ใช้) */
export type ProfileRow = {
  goal: string | null;
  heightCm: number | null;
  age: number | null;
  workoutWindow: string | null;
};
export type SwapRow = { key: string; recipeId: string };
export type CheckedRow = { key: string };
export type MealCheckRow = { mealIndex: number };
export type LiftSetRow = { exercise: string; setIndex: number; kg: number; reps: number };
export type DayLogRow = {
  date: string;
  weightKg: number | null;
  workoutDone: boolean;
  waterMl: number;
  extraKcal: number | null;
  extraProtein: number | null;
  meals: MealCheckRow[];
  lifts: LiftSetRow[];
};
export type StateRows = {
  profile: ProfileRow | null;
  swaps: SwapRow[];
  checked: CheckedRow[];
  dayLogs: DayLogRow[];
};

/** รูปแบบ normalized สำหรับ seed ลง DB (migrate) */
export type DaySeed = {
  date: string;
  weightKg: number | null;
  workoutDone: boolean;
  waterMl: number;
  extraKcal: number | null;
  extraProtein: number | null;
  meals: number[];
  lifts: { exercise: string; sets: SetEntry[] }[];
};
export type SeedRows = {
  profile: ProfileRow | null;
  swaps: SwapRow[];
  checked: CheckedRow[];
  days: DaySeed[];
};
