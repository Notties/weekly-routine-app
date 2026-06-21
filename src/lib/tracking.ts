// src/lib/tracking.ts (เริ่มต้น — Task 2 จะเติมต่อ)
import type { DayKey, ISODate } from "@/data/types";

/** index 0..6 = อาทิตย์..เสาร์ (ตรงกับ Date.getDay()) */
export const DAY_ORDER: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** "YYYY-MM-DD" → DayKey */
export function dayKeyForDate(iso: ISODate): DayKey {
  const [y, m, d] = iso.split("-").map(Number);
  return DAY_ORDER[new Date(y, m - 1, d).getDay()];
}
