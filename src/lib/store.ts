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
  setProfileField: <K extends keyof ProfileOverride>(
    field: K,
    value: ProfileOverride[K]
  ) => void;
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
      setProfileField: (field, value) =>
        set((s) => ({
          profileOverride: { ...s.profileOverride, [field]: value },
        })),
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
