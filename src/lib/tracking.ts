import { water } from "@/data/tips";
import type { Day, DayKey, DayLog, ISODate, Profile, ProfileOverride } from "@/data/types";

/** index 0..6 = อาทิตย์..เสาร์ (ตรงกับ Date.getDay()) */
export const DAY_ORDER: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const WATER_TARGET_ML = water.litersPerDay * 1000;

/** Date → "YYYY-MM-DD" (เวลาท้องถิ่น) */
export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "YYYY-MM-DD" → DayKey */
export function dayKeyForDate(iso: ISODate): DayKey {
  const [y, m, d] = iso.split("-").map(Number);
  return DAY_ORDER[new Date(y, m - 1, d).getDay()];
}

function addDays(iso: ISODate, delta: number): ISODate {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + delta));
}

function dayForDate(weekDays: Day[], iso: ISODate): Day | undefined {
  const key = dayKeyForDate(iso);
  return weekDays.find((d) => d.key === key);
}

/** entries ที่มี weightKg เรียงวันที่เก่า→ใหม่ */
export function weightSeries(
  log: Record<ISODate, DayLog>
): { date: ISODate; kg: number }[] {
  return Object.entries(log)
    .filter(([, d]) => typeof d.weightKg === "number")
    .map(([date, d]) => ({ date, kg: d.weightKg as number }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function effectiveWeight(
  log: Record<ISODate, DayLog>,
  fallbackKg: number
): number {
  const series = weightSeries(log);
  return series.length ? series[series.length - 1].kg : fallbackKg;
}

export function effectiveProfile(
  base: Profile,
  override: ProfileOverride,
  log: Record<ISODate, DayLog>
): Profile {
  return { ...base, ...override, weightKg: effectiveWeight(log, base.weightKg) };
}

export function dayAdherence(
  day: Day,
  dayLog: DayLog | undefined,
  waterTargetMl: number = WATER_TARGET_ML
): { done: number; total: number; pct: number } {
  const mealCount = day.meals.length;
  const hasWorkout = !!day.workout;
  const total = mealCount + (hasWorkout ? 1 : 0) + 1; // +1 = น้ำ
  let done = 0;
  const meals = dayLog?.meals ?? {};
  for (let i = 0; i < mealCount; i++) if (meals[i]) done++;
  if (hasWorkout && dayLog?.workoutDone) done++;
  if ((dayLog?.waterMl ?? 0) >= waterTargetMl) done++;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

export function computeStreak(
  log: Record<ISODate, DayLog>,
  weekDays: Day[],
  todayISO: ISODate,
  waterTargetMl: number = WATER_TARGET_ML,
  threshold = 0.8
): number {
  const bar = threshold * 100;
  let cursor = todayISO;
  const todayDay = dayForDate(weekDays, todayISO);
  const todayPct = todayDay
    ? dayAdherence(todayDay, log[todayISO], waterTargetMl).pct
    : 0;
  if (todayPct < bar) cursor = addDays(todayISO, -1);
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const day = dayForDate(weekDays, cursor);
    if (!day) break;
    const pct = dayAdherence(day, log[cursor], waterTargetMl).pct;
    if (pct >= bar) {
      streak++;
      cursor = addDays(cursor, -1);
    } else break;
  }
  return streak;
}

export function daysHitInLast(
  log: Record<ISODate, DayLog>,
  weekDays: Day[],
  todayISO: ISODate,
  n: number,
  waterTargetMl: number = WATER_TARGET_ML,
  threshold = 0.8
): number {
  const bar = threshold * 100;
  let hit = 0;
  let cursor = todayISO;
  for (let i = 0; i < n; i++) {
    const day = dayForDate(weekDays, cursor);
    if (day && dayAdherence(day, log[cursor], waterTargetMl).pct >= bar) hit++;
    cursor = addDays(cursor, -1);
  }
  return hit;
}

export type HeatCell = { date: ISODate; pct: number | null };

/** ประวัติ adherence จัดเป็นตารางตามวันในสัปดาห์ (อา..ส), ยาว weeks*7
 *  วันอนาคต (หลัง todayISO) → pct = null */
export function adherenceHistory(
  log: Record<ISODate, DayLog>,
  weekDays: Day[],
  todayISO: ISODate,
  weeks: number,
  waterTargetMl: number = WATER_TARGET_ML
): HeatCell[] {
  const [ty, tm, td] = todayISO.split("-").map(Number);
  const todayDow = new Date(ty, tm - 1, td).getDay(); // 0=อาทิตย์
  // เริ่มที่วันอาทิตย์ของสัปดาห์เมื่อ (weeks-1) สัปดาห์ก่อน
  const gridStart = addDays(todayISO, -todayDow - (weeks - 1) * 7);
  const cells: HeatCell[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(gridStart, i);
    if (date > todayISO) {
      cells.push({ date, pct: null });
    } else {
      const day = dayForDate(weekDays, date);
      cells.push({
        date,
        pct: day ? dayAdherence(day, log[date], waterTargetMl).pct : 0,
      });
    }
  }
  return cells;
}
