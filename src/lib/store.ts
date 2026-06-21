import { create } from "zustand";
import type { DayLog, ISODate, ProfileOverride } from "@/data/types";
import { apiGet, apiSend, AuthError, NetworkError } from "@/lib/api/client";
import type { SyncSlice } from "@/lib/api/types";

type AppState = {
  hasHydrated: boolean;
  online: boolean;
  syncError: string | null;
  selectedDay: import("@/data/types").DayKey | null;
  swaps: Record<string, string>;
  checked: Record<string, boolean>;
  log: Record<ISODate, DayLog>;
  profileOverride: ProfileOverride;
  restEndsAt: number | null;
  restTotal: number | null;

  hydrate: () => Promise<void>;
  setSelectedDay: (k: import("@/data/types").DayKey) => void;
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
  logSet: (date: ISODate, exercise: string, index: number, kg: number, reps: number) => void;
  clearLift: (date: ISODate, exercise: string) => void;
  startRest: (seconds: number) => void;
  addRest: (seconds: number) => void;
  stopRest: () => void;
  setProfileField: <K extends keyof ProfileOverride>(field: K, value: ProfileOverride[K]) => void;
};

/** อัปเดต log ของวันเดียวแบบ immutable */
function patchDay(
  log: Record<ISODate, DayLog>,
  date: ISODate,
  fn: (d: DayLog) => DayLog
): Record<ISODate, DayLog> {
  return { ...log, [date]: fn(log[date] ?? {}) };
}

export const useAppStore = create<AppState>()((set, get) => {
  /** optimistic helper: snapshot → apply → call API → rollback+error ถ้าพลาด */
  function optimistic(apply: () => void, call: () => Promise<void>) {
    const snapshot = {
      swaps: get().swaps, checked: get().checked,
      log: get().log, profileOverride: get().profileOverride,
    };
    apply();
    set({ syncError: null });
    void call()
      .then(() => set({ online: true }))
      .catch((e) => {
        set({ ...snapshot });
        if (e instanceof AuthError) set({ syncError: "ต้องเข้าสู่ระบบใหม่" });
        else if (e instanceof NetworkError) set({ online: false, syncError: "ออฟไลน์ ยังไม่บันทึก" });
        else set({ syncError: "บันทึกไม่สำเร็จ" });
      });
  }

  return {
    hasHydrated: false,
    online: true,
    syncError: null,
    selectedDay: null,
    swaps: {},
    checked: {},
    log: {},
    profileOverride: {},
    restEndsAt: null,
    restTotal: null,

    hydrate: async () => {
      try {
        const slice = await apiGet<SyncSlice>("/api/state");
        set({
          swaps: slice.swaps, checked: slice.checked,
          log: slice.log, profileOverride: slice.profileOverride,
          hasHydrated: true, online: true, syncError: null,
        });
      } catch (e) {
        // ยังถือว่า hydrate เสร็จ (จะโชว์หน้า login/offline ตาม error)
        set({
          hasHydrated: true,
          online: !(e instanceof NetworkError),
          syncError: e instanceof AuthError ? null : "โหลดข้อมูลไม่สำเร็จ",
        });
      }
    },

    setSelectedDay: (k) => set({ selectedDay: k }),

    setSwap: (key, recipeId) =>
      optimistic(
        () => set((s) => ({ swaps: { ...s.swaps, [key]: recipeId } })),
        () => apiSend("PUT", `/api/swaps/${encodeURIComponent(key)}`, { recipeId })
      ),

    clearSwap: (key) =>
      optimistic(
        () => set((s) => {
          const next = { ...s.swaps }; delete next[key]; return { swaps: next };
        }),
        () => apiSend("DELETE", `/api/swaps/${encodeURIComponent(key)}`)
      ),

    toggleChecked: (key) => {
      const isOn = !!get().checked[key];
      optimistic(
        () => set((s) => {
          const next = { ...s.checked };
          if (next[key]) delete next[key]; else next[key] = true;
          return { checked: next };
        }),
        () => isOn
          ? apiSend("DELETE", `/api/checked/${encodeURIComponent(key)}`)
          : apiSend("PUT", `/api/checked/${encodeURIComponent(key)}`)
      );
    },

    clearChecked: () =>
      optimistic(
        () => set({ checked: {} }),
        () => apiSend("DELETE", "/api/checked")
      ),

    logWeight: (date, kg) =>
      optimistic(
        () => set((s) => ({ log: patchDay(s.log, date, (d) => ({ ...d, weightKg: kg })) })),
        () => apiSend("PUT", `/api/days/${date}`, { weightKg: kg })
      ),

    toggleMeal: (date, index) => {
      const isOn = !!get().log[date]?.meals?.[index];
      optimistic(
        () => set((s) => ({
          log: patchDay(s.log, date, (d) => {
            const meals = { ...(d.meals ?? {}) };
            if (meals[index]) delete meals[index]; else meals[index] = true;
            return { ...d, meals };
          }),
        })),
        () => isOn
          ? apiSend("DELETE", `/api/days/${date}/meals/${index}`)
          : apiSend("PUT", `/api/days/${date}/meals/${index}`)
      );
    },

    setWorkoutDone: (date, done) =>
      optimistic(
        () => set((s) => ({ log: patchDay(s.log, date, (d) => ({ ...d, workoutDone: done })) })),
        () => apiSend("PUT", `/api/days/${date}`, { workoutDone: done })
      ),

    addWater: (date, deltaMl) => {
      const next = Math.max(0, (get().log[date]?.waterMl ?? 0) + deltaMl);
      optimistic(
        () => set((s) => ({ log: patchDay(s.log, date, (d) => ({ ...d, waterMl: next })) })),
        () => apiSend("PUT", `/api/days/${date}`, { waterMl: next })
      );
    },

    addExtra: (date, kcal, protein) => {
      const cur = get().log[date]?.extra ?? { kcal: 0, protein: 0 };
      const extra = {
        kcal: Math.max(0, cur.kcal + kcal),
        protein: Math.max(0, cur.protein + protein),
      };
      optimistic(
        () => set((s) => ({ log: patchDay(s.log, date, (d) => ({ ...d, extra })) })),
        () => apiSend("PUT", `/api/days/${date}`, {
          extraKcal: extra.kcal, extraProtein: extra.protein,
        })
      );
    },

    clearExtra: (date) =>
      optimistic(
        () => set((s) => ({
          log: patchDay(s.log, date, (d) => {
            const next = { ...d }; delete next.extra; return next;
          }),
        })),
        () => apiSend("PUT", `/api/days/${date}`, { extraKcal: null, extraProtein: null })
      ),

    logSet: (date, exercise, index, kg, reps) => {
      const arr = [...(get().log[date]?.lifts?.[exercise] ?? [])];
      while (arr.length <= index) arr.push({ kg: 0, reps: 0 });
      arr[index] = { kg, reps };
      optimistic(
        () => set((s) => ({
          log: patchDay(s.log, date, (d) => ({
            ...d, lifts: { ...(d.lifts ?? {}), [exercise]: arr },
          })),
        })),
        () => apiSend("PUT", `/api/days/${date}/lifts/${encodeURIComponent(exercise)}`, { sets: arr })
      );
    },

    clearLift: (date, exercise) =>
      optimistic(
        () => set((s) => {
          const cur = s.log[date];
          if (!cur?.lifts?.[exercise]) return {};
          const lifts = { ...cur.lifts }; delete lifts[exercise];
          return { log: patchDay(s.log, date, (d) => ({ ...d, lifts })) };
        }),
        () => apiSend("DELETE", `/api/days/${date}/lifts/${encodeURIComponent(exercise)}`)
      ),

    startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }),
    addRest: (seconds) => set((s) =>
      s.restEndsAt
        ? { restEndsAt: s.restEndsAt + seconds * 1000, restTotal: (s.restTotal ?? 0) + seconds }
        : {}
    ),
    stopRest: () => set({ restEndsAt: null, restTotal: null }),

    setProfileField: (field, value) => {
      const nextProfile = { ...get().profileOverride, [field]: value };
      optimistic(
        () => set({ profileOverride: nextProfile }),
        () => apiSend("PUT", "/api/profile", nextProfile)
      );
    },
  };
});
