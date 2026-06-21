import type { DayLog } from "@/data/types";
import type {
  DaySeed, SeedRows, StateRows, SyncSlice,
} from "./types";

export function rowsToSlice(rows: StateRows): SyncSlice {
  const swaps: Record<string, string> = {};
  for (const s of rows.swaps) swaps[s.key] = s.recipeId;

  const checked: Record<string, boolean> = {};
  for (const c of rows.checked) checked[c.key] = true;

  const log: Record<string, DayLog> = {};
  for (const d of rows.dayLogs) {
    const day: DayLog = {};
    if (d.weightKg !== null) day.weightKg = d.weightKg;
    if (d.workoutDone) day.workoutDone = true;
    if (d.waterMl) day.waterMl = d.waterMl;
    if (d.extraKcal !== null || d.extraProtein !== null) {
      day.extra = { kcal: d.extraKcal ?? 0, protein: d.extraProtein ?? 0 };
    }
    if (d.meals.length) {
      const meals: Record<number, true> = {};
      for (const m of d.meals) meals[m.mealIndex] = true;
      day.meals = meals;
    }
    if (d.lifts.length) {
      const byExercise: Record<string, { setIndex: number; kg: number; reps: number }[]> = {};
      for (const l of d.lifts) (byExercise[l.exercise] ??= []).push(l);
      const lifts: Record<string, { kg: number; reps: number }[]> = {};
      for (const [ex, arr] of Object.entries(byExercise)) {
        lifts[ex] = arr
          .sort((a, b) => a.setIndex - b.setIndex)
          .map((s) => ({ kg: s.kg, reps: s.reps }));
      }
      day.lifts = lifts;
    }
    log[d.date] = day;
  }

  // สร้าง profileOverride โดยละ field ที่เป็น null ออก
  const profileOverride: SyncSlice["profileOverride"] = {};
  if (rows.profile) {
    if (rows.profile.goal !== null) profileOverride.goal = rows.profile.goal;
    if (rows.profile.heightCm !== null) profileOverride.heightCm = rows.profile.heightCm;
    if (rows.profile.age !== null) profileOverride.age = rows.profile.age;
    if (rows.profile.workoutWindow !== null) profileOverride.workoutWindow = rows.profile.workoutWindow;
  }

  return { swaps, checked, log, profileOverride };
}

export function sliceToRows(slice: SyncSlice): SeedRows {
  const swaps = Object.entries(slice.swaps).map(([key, recipeId]) => ({ key, recipeId }));
  const checked = Object.entries(slice.checked)
    .filter(([, v]) => v)
    .map(([key]) => ({ key }));

  const days: DaySeed[] = Object.entries(slice.log).map(([date, d]) => ({
    date,
    weightKg: d.weightKg ?? null,
    workoutDone: d.workoutDone ?? false,
    waterMl: d.waterMl ?? 0,
    extraKcal: d.extra?.kcal ?? null,
    extraProtein: d.extra?.protein ?? null,
    meals: Object.entries(d.meals ?? {})
      .filter(([, v]) => v)
      .map(([i]) => Number(i)),
    lifts: Object.entries(d.lifts ?? {}).map(([exercise, sets]) => ({ exercise, sets })),
  }));

  const profile = slice.profileOverride
    ? {
        goal: slice.profileOverride.goal ?? null,
        heightCm: slice.profileOverride.heightCm ?? null,
        age: slice.profileOverride.age ?? null,
        workoutWindow: slice.profileOverride.workoutWindow ?? null,
      }
    : null;

  return { profile, swaps, checked, days };
}
