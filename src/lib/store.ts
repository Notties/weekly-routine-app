import { create } from "zustand";
import type { DayLog, DayKey, ISODate, ProfileOverride } from "@/data/types";

// ───────────────────────────────────────────────────────────
// สโตร์กลางของแอป — เก็บทุกอย่างใน localStorage ของเครื่อง
// ไม่มีบัญชี ไม่มีเซิร์ฟเวอร์ ไม่มีฐานข้อมูล เปิดแอปแล้วใช้ได้เลย
// (ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น — ล้าง site data = เริ่มใหม่)
// ───────────────────────────────────────────────────────────

const LS_KEY = "knot-state-v1";

/** ส่วนของ state ที่ persist ลง localStorage */
type PersistedState = {
  swaps: Record<string, string>;
  checked: Record<string, boolean>;
  log: Record<ISODate, DayLog>;
  profileOverride: ProfileOverride;
};

type AppState = PersistedState & {
  hasHydrated: boolean;
  selectedDay: DayKey | null;
  restEndsAt: number | null;
  restTotal: number | null;

  hydrate: () => void;
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

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PersistedState>;
    return {
      swaps: p.swaps ?? {},
      checked: p.checked ?? {},
      log: p.log ?? {},
      profileOverride: p.profileOverride ?? {},
    };
  } catch {
    return null; // ข้อมูลเพี้ยน/อ่านไม่ได้ → เริ่มเปล่า ไม่พังแอป
  }
}

export const useAppStore = create<AppState>()((set, get) => {
  /** apply การเปลี่ยน state แล้วบันทึกลง localStorage ทันที */
  function commit(apply: () => void) {
    apply();
    try {
      const { swaps, checked, log, profileOverride } = get();
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ swaps, checked, log, profileOverride })
      );
    } catch {
      // storage เต็ม/ถูกบล็อก — แอปยังใช้ต่อได้ แค่ไม่บันทึกข้ามรอบ
    }
  }

  return {
    hasHydrated: false,
    selectedDay: null,
    swaps: {},
    checked: {},
    log: {},
    profileOverride: {},
    restEndsAt: null,
    restTotal: null,

    // โหลด state จาก localStorage (เรียกครั้งเดียวตอนเปิดแอป — client เท่านั้น)
    hydrate: () => {
      const saved = loadPersisted();
      set({ ...(saved ?? {}), hasHydrated: true });
    },

    setSelectedDay: (k) => set({ selectedDay: k }),

    setSwap: (key, recipeId) =>
      commit(() => set((s) => ({ swaps: { ...s.swaps, [key]: recipeId } }))),

    clearSwap: (key) =>
      commit(() =>
        set((s) => {
          const next = { ...s.swaps };
          delete next[key];
          return { swaps: next };
        })
      ),

    toggleChecked: (key) =>
      commit(() =>
        set((s) => {
          const next = { ...s.checked };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { checked: next };
        })
      ),

    clearChecked: () => commit(() => set({ checked: {} })),

    logWeight: (date, kg) =>
      commit(() =>
        set((s) => ({ log: patchDay(s.log, date, (d) => ({ ...d, weightKg: kg })) }))
      ),

    toggleMeal: (date, index) =>
      commit(() =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => {
            const meals = { ...(d.meals ?? {}) };
            if (meals[index]) delete meals[index];
            else meals[index] = true;
            return { ...d, meals };
          }),
        }))
      ),

    setWorkoutDone: (date, done) =>
      commit(() =>
        set((s) => ({ log: patchDay(s.log, date, (d) => ({ ...d, workoutDone: done })) }))
      ),

    addWater: (date, deltaMl) =>
      commit(() =>
        set((s) => {
          const next = Math.max(0, (s.log[date]?.waterMl ?? 0) + deltaMl);
          return { log: patchDay(s.log, date, (d) => ({ ...d, waterMl: next })) };
        })
      ),

    addExtra: (date, kcal, protein) =>
      commit(() =>
        set((s) => {
          const cur = s.log[date]?.extra ?? { kcal: 0, protein: 0 };
          const extra = {
            kcal: Math.max(0, cur.kcal + kcal),
            protein: Math.max(0, cur.protein + protein),
          };
          return { log: patchDay(s.log, date, (d) => ({ ...d, extra })) };
        })
      ),

    clearExtra: (date) =>
      commit(() =>
        set((s) => ({
          log: patchDay(s.log, date, (d) => {
            const next = { ...d };
            delete next.extra;
            return next;
          }),
        }))
      ),

    logSet: (date, exercise, index, kg, reps) =>
      commit(() =>
        set((s) => {
          const arr = [...(s.log[date]?.lifts?.[exercise] ?? [])];
          while (arr.length <= index) arr.push({ kg: 0, reps: 0 });
          arr[index] = { kg, reps };
          return {
            log: patchDay(s.log, date, (d) => ({
              ...d,
              lifts: { ...(d.lifts ?? {}), [exercise]: arr },
            })),
          };
        })
      ),

    clearLift: (date, exercise) =>
      commit(() =>
        set((s) => {
          const cur = s.log[date];
          if (!cur?.lifts?.[exercise]) return {};
          const lifts = { ...cur.lifts };
          delete lifts[exercise];
          return { log: patchDay(s.log, date, (d) => ({ ...d, lifts })) };
        })
      ),

    startRest: (seconds) =>
      set({ restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }),
    addRest: (seconds) =>
      set((s) =>
        s.restEndsAt
          ? { restEndsAt: s.restEndsAt + seconds * 1000, restTotal: (s.restTotal ?? 0) + seconds }
          : {}
      ),
    stopRest: () => set({ restEndsAt: null, restTotal: null }),

    setProfileField: (field, value) =>
      commit(() =>
        set((s) => ({ profileOverride: { ...s.profileOverride, [field]: value } }))
      ),
  };
});
