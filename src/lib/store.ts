import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DayKey, DayLog, ISODate, ProfileOverride } from "@/data/types";

type AppState = {
  hasHydrated: boolean;
  selectedDay: DayKey | null;
  swaps: Record<string, string>;
  checked: Record<string, boolean>;
  log: Record<ISODate, DayLog>;
  profileOverride: ProfileOverride;
  /** rest timer (ชั่วคราว ไม่ persist): timestamp ที่พักจะครบ + เวลาทั้งหมด (วิ) */
  restEndsAt: number | null;
  restTotal: number | null;

  setHasHydrated: (v: boolean) => void;
  setSelectedDay: (k: DayKey) => void;
  setSwap: (key: string, recipeId: string) => void;
  clearSwap: (key: string) => void;
  toggleChecked: (key: string) => void;
  clearChecked: () => void;
  logWeight: (date: ISODate, kg: number) => void;
  toggleMeal: (date: ISODate, index: number) => void;
  setWorkoutDone: (date: ISODate, done: boolean) => void;
  addWater: (date: ISODate, deltaMl: number) => void;
  addExtra: (date: ISODate, kcal: number, protein: number) => void;
  clearExtra: (date: ISODate) => void;
  logSet: (
    date: ISODate,
    exercise: string,
    index: number,
    kg: number,
    reps: number
  ) => void;
  clearLift: (date: ISODate, exercise: string) => void;
  startRest: (seconds: number) => void;
  addRest: (seconds: number) => void;
  stopRest: () => void;
  setProfileField: <K extends keyof ProfileOverride>(
    field: K,
    value: ProfileOverride[K]
  ) => void;
  /** ทับ state ที่ sync ได้ (จากผล merge cloud) */
  applyRemoteState: (slice: {
    swaps: Record<string, string>;
    checked: Record<string, boolean>;
    log: Record<ISODate, DayLog>;
    profileOverride: ProfileOverride;
  }) => void;
};

/** อัปเดต log ของวันเดียวแบบ immutable */
function patchDay(
  log: Record<ISODate, DayLog>,
  date: ISODate,
  fn: (d: DayLog) => DayLog
): Record<ISODate, DayLog> {
  return { ...log, [date]: fn(log[date] ?? {}) };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      selectedDay: null,
      swaps: {},
      checked: {},
      log: {},
      profileOverride: {},
      restEndsAt: null,
      restTotal: null,

      setHasHydrated: (v) => set({ hasHydrated: v }),
      setSelectedDay: (k) => set({ selectedDay: k }),
      setSwap: (key, recipeId) =>
        set((s) => ({ swaps: { ...s.swaps, [key]: recipeId } })),
      clearSwap: (key) =>
        set((s) => {
          const next = { ...s.swaps };
          delete next[key];
          return { swaps: next };
        }),
      toggleChecked: (key) =>
        set((s) => {
          const next = { ...s.checked };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { checked: next };
        }),
      clearChecked: () => set({ checked: {} }),
      logWeight: (date, kg) =>
        set((s) => ({ log: patchDay(s.log, date, (d) => ({ ...d, weightKg: kg })) })),
      toggleMeal: (date, index) =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => {
            const meals = { ...(d.meals ?? {}) };
            if (meals[index]) delete meals[index];
            else meals[index] = true;
            return { ...d, meals };
          }),
        })),
      setWorkoutDone: (date, done) =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => ({ ...d, workoutDone: done })),
        })),
      addWater: (date, deltaMl) =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => ({
            ...d,
            waterMl: Math.max(0, (d.waterMl ?? 0) + deltaMl),
          })),
        })),
      addExtra: (date, kcal, protein) =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => {
            const cur = d.extra ?? { kcal: 0, protein: 0 };
            return {
              ...d,
              extra: {
                kcal: Math.max(0, cur.kcal + kcal),
                protein: Math.max(0, cur.protein + protein),
              },
            };
          }),
        })),
      clearExtra: (date) =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => {
            const next = { ...d };
            delete next.extra;
            return next;
          }),
        })),
      logSet: (date, exercise, index, kg, reps) =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => {
            const lifts = { ...(d.lifts ?? {}) };
            const arr = [...(lifts[exercise] ?? [])];
            while (arr.length <= index) arr.push({ kg: 0, reps: 0 });
            arr[index] = { kg, reps };
            lifts[exercise] = arr;
            return { ...d, lifts };
          }),
        })),
      clearLift: (date, exercise) =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => {
            if (!d.lifts?.[exercise]) return d;
            const lifts = { ...d.lifts };
            delete lifts[exercise];
            return { ...d, lifts };
          }),
        })),
      startRest: (seconds) =>
        set({ restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }),
      addRest: (seconds) =>
        set((s) =>
          s.restEndsAt
            ? {
                restEndsAt: s.restEndsAt + seconds * 1000,
                restTotal: (s.restTotal ?? 0) + seconds,
              }
            : {}
        ),
      stopRest: () => set({ restEndsAt: null, restTotal: null }),
      setProfileField: (field, value) =>
        set((s) => ({
          profileOverride: { ...s.profileOverride, [field]: value },
        })),
      applyRemoteState: (slice) =>
        set({
          swaps: slice.swaps,
          checked: slice.checked,
          log: slice.log,
          profileOverride: slice.profileOverride,
        }),
    }),
    {
      name: "knot-gym",
      skipHydration: true,
      partialize: (s) => ({
        selectedDay: s.selectedDay,
        swaps: s.swaps,
        checked: s.checked,
        log: s.log,
        profileOverride: s.profileOverride,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
