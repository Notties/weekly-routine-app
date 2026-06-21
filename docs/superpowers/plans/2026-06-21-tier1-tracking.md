# Tier 1 Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มระบบติดตามผล — บันทึกน้ำหนัก (เป็น time series) + ติ๊กทำเสร็จรายวัน + แก้โปรไฟล์ในแอป โดยน้ำหนักล่าสุดเป็นตัวตั้งเป้าโภชนาการ ทั้งหมดเก็บผ่าน Zustand persist

**Architecture:** state ทั้งแอปย้ายมาอยู่ใน Zustand store เดียว (`lib/store.ts`) + persist middleware (key `"knot-gym"`, `skipHydration` + rehydrate ใน effect เพื่อ static-export-safe) ตรรกะคำนวณเป็นฟังก์ชันบริสุทธิ์ใน `lib/tracking.ts` (เทสต์ TDD) UI: ติ๊ก inline ในการ์ดมื้อ/ออกกำลัง + ตัวนับน้ำในแท็บอาหาร + หน้า "ฉัน" เปิดจากแถบโปรไฟล์

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript, Tailwind v4, **Zustand v5 + persist**, lucide-react, `bun test`

## Global Constraints

- เพิ่ม dependency `zustand` (`bun add zustand`)
- Store เดียว `useAppStore` (`lib/store.ts`), persist `name: "knot-gym"`, `skipHydration: true`, rehydrate ใน `useEffect`, ตั้ง `hasHydrated` ผ่าน `onRehydrateStorage` — **RoutineApp ต้อง gate การ render จนกว่า `hasHydrated && selectedDay`** (กัน hydration mismatch)
- **ลบ `src/lib/storage.ts`** — ไม่มี migration ข้อมูลเก่า (ยอมรับการรีเซ็ตครั้งเดียว)
- **น้ำหนักอยู่ใน log เท่านั้น** (`ProfileOverride` ไม่มี weightKg) — current weight = entry ล่าสุด, fallback `profile.weightKg` (75)
- ติ๊กทำเสร็จ/นับน้ำ **ใช้งานได้เฉพาะวันนี้** (`selectedDay === todayKey`)
- adherence threshold สตรีค = **0.8** · เป้าน้ำ `WATER_TARGET_ML = water.litersPerDay * 1000` (3000) · 1 ขวด = 1500 มล.
- ภาษาไทย, การ์ด `rounded-2xl border border-border bg-card p-4`, ตัวเลข `tnum`, ไอคอน lucide-react
- ตรรกะใน `tracking.ts` รับ `todayISO`/`week`/`log` เป็น args (ไม่เรียก `Date.now`/argless `new Date`) เพื่อเทสต์ได้
- Test: `bun test src/lib` · Type-check ทั้งแอป: `bun run build` (ต้องผ่านก่อน commit ทุกงานที่แตะ UI)

---

## File Structure

| ไฟล์ | ความรับผิดชอบ |
|---|---|
| `package.json` | + `zustand` |
| `src/data/types.ts` | + `ISODate`, `DayLog`, `ProfileOverride` |
| `src/lib/store.ts` (ใหม่) | Zustand store + persist (state + actions) |
| `src/lib/storage.ts` | **ลบ** |
| `src/lib/tracking.ts` (ใหม่) | ฟังก์ชันบริสุทธิ์: date/adherence/weight/profile |
| `src/lib/tracking.test.ts` (ใหม่) | เทสต์ TDD |
| `src/components/routine-app.tsx` | ใช้ store, hydration gate, effProfile, แท็บ "ฉัน", props ติ๊ก |
| `src/components/views/shopping-view.tsx` | ใช้ store แทน storage.ts |
| `src/components/profile-header.tsx` | รับ `profile`+`onOpen` (กดเปิดหน้าฉัน) |
| `src/components/views/meal-view.tsx` | รับ `profile` (effProfile), ตัวนับน้ำ, ส่ง props ติ๊กมื้อ |
| `src/components/meal-card.tsx` | checkbox "กินแล้ว" (props) |
| `src/components/views/workout-view.tsx` | toggle "เล่นเสร็จ" (props) |
| `src/components/views/me-view.tsx` (ใหม่) | หน้า "ฉัน" |
| `src/components/weight-trend.tsx` (ใหม่) | sparkline SVG |

---

## Task 1: Zustand store + migrate existing persistence

ย้าย state เดิม (selectedDay/swaps/checked) มาที่ store เดียว + เตรียม state ใหม่ (log/profileOverride) ลบ `storage.ts` พฤติกรรมแอปต้องเหมือนเดิมเป๊ะ

**Files:**
- Modify: `package.json` (+zustand), `src/data/types.ts`
- Create: `src/lib/store.ts`
- Delete: `src/lib/storage.ts`
- Modify: `src/components/routine-app.tsx`, `src/components/views/shopping-view.tsx`

**Interfaces:**
- Produces: `useAppStore` (hook) + state `{hasHydrated, selectedDay, swaps, checked, log, profileOverride}` + actions `setSelectedDay, setSwap, clearSwap, toggleChecked, clearChecked, logWeight, toggleMeal, setWorkoutDone, addWater, setProfileField, setHasHydrated`
- Produces types: `ISODate`, `DayLog`, `ProfileOverride`

- [ ] **Step 1: ติดตั้ง zustand**

Run: `bun add zustand`
Expected: เพิ่มใน dependencies ของ `package.json`

- [ ] **Step 2: เพิ่ม types ใน `src/data/types.ts`**

เพิ่มท้ายไฟล์:

```ts
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
```

- [ ] **Step 3: สร้าง `src/lib/store.ts`**

```ts
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
```

- [ ] **Step 4: ลบ `src/lib/storage.ts`**

```bash
git rm src/lib/storage.ts
```

- [ ] **Step 5: เขียน `src/components/routine-app.tsx` ใหม่ (ใช้ store + hydration gate)**

```tsx
"use client";

import * as React from "react";
import {
  ClipboardList,
  Dumbbell,
  Salad,
  BedDouble,
  ShoppingCart,
  BookOpen,
  CalendarCheck,
} from "lucide-react";
import { week } from "@/data";
import type { DayKey } from "@/data/types";
import { useAppStore } from "@/lib/store";
import { DAY_ORDER } from "@/lib/tracking";
import { resolveDay, swapKey } from "@/lib/meals";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile-header";
import { DayPicker } from "@/components/day-picker";
import { DayTypeBadge } from "@/components/day-type-badge";
import { TimelineView } from "@/components/views/timeline-view";
import { WorkoutView } from "@/components/views/workout-view";
import { MealView } from "@/components/views/meal-view";
import { SleepView } from "@/components/views/sleep-view";
import { ShoppingView } from "@/components/views/shopping-view";
import { MenuLibraryView } from "@/components/views/menu-library-view";

const TABS = [
  { value: "routine", label: "รูทีน", Icon: ClipboardList },
  { value: "workout", label: "ออกกำลัง", Icon: Dumbbell },
  { value: "meal", label: "อาหาร", Icon: Salad },
  { value: "sleep", label: "นอน", Icon: BedDouble },
  { value: "shopping", label: "ซื้อของ", Icon: ShoppingCart },
  { value: "menu", label: "เมนู", Icon: BookOpen },
] as const;

/** แท็บที่ไม่ผูกกับวันที่เลือก (ซ่อนแถบวัน + ปิดปัดเปลี่ยนวัน) */
const WEEK_TABS = new Set(["shopping", "menu", "me"]);

export function RoutineApp() {
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const selected = useAppStore((s) => s.selectedDay);
  const swaps = useAppStore((s) => s.swaps);
  const setSelectedDay = useAppStore((s) => s.setSelectedDay);
  const setSwap = useAppStore((s) => s.setSwap);

  const [today, setToday] = React.useState<DayKey | null>(null);
  const [tab, setTab] = React.useState<string>("routine");
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);

  // mount: rehydrate store + รู้ "วันนี้"
  React.useEffect(() => {
    useAppStore.persist.rehydrate();
    setToday(DAY_ORDER[new Date().getDay()]);
  }, []);

  // หลัง hydrate: ถ้ายังไม่เคยเลือกวัน ใช้วันนี้
  React.useEffect(() => {
    if (hasHydrated && !selected && today) setSelectedDay(today);
  }, [hasHydrated, selected, today, setSelectedDay]);

  const handleSelect = (key: DayKey) => setSelectedDay(key);

  const applySwap = (mealIndex: number, recipeId: string) => {
    if (!selected) return;
    setSwap(swapKey(selected, mealIndex), recipeId);
  };

  const handleTab = (value: string) => {
    setTab(value);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const changeDayBy = (dir: number) => {
    const cur = selected ?? "mon";
    const idx = week.findIndex((d) => d.key === cur);
    const next = (idx + dir + week.length) % week.length;
    handleSelect(week[next].key);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || WEEK_TABS.has(tab)) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      changeDayBy(dx < 0 ? 1 : -1);
    }
  };

  // gate: กัน hydration mismatch (static export)
  if (!hasHydrated || !selected) {
    return <div className="min-h-full" />;
  }

  const day = week.find((d) => d.key === selected) ?? week[0];
  const resolvedDay = resolveDay(day, swaps);

  return (
    <Tabs
      value={tab}
      onValueChange={handleTab}
      className="flex min-h-full flex-col gap-0"
    >
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <ProfileHeader />
        <DayPicker selected={selected} today={today} onSelect={handleSelect} />
        <TabsList className="mx-auto grid h-auto w-full max-w-2xl grid-cols-6 rounded-none bg-background p-0 group-data-horizontal/tabs:h-auto">
          {TABS.map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-auto flex-col gap-1 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0.5 py-2.5 text-[10px] leading-tight shadow-none data-active:border-primary data-active:bg-transparent data-active:font-semibold data-active:text-primary data-active:shadow-none dark:data-active:border-primary dark:data-active:bg-transparent dark:data-active:text-primary"
            >
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <main
        className="mx-auto w-full max-w-2xl flex-1 pb-safe"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {!WEEK_TABS.has(tab) && (
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <span>
                {day.label}
                {day.type !== "rest" && (
                  <span className="ml-2 font-medium text-muted-foreground">
                    {day.title}
                  </span>
                )}
              </span>
              {today && selected !== today && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelect(today)}
                  className="h-6 gap-1 px-2 text-xs font-medium text-primary hover:text-primary"
                >
                  <CalendarCheck className="size-3.5" />
                  วันนี้
                </Button>
              )}
            </h2>
            <DayTypeBadge type={day.type} />
          </div>
        )}

        <TabsContent value="routine">
          <TimelineView day={resolvedDay} isToday={selected === today} />
        </TabsContent>
        <TabsContent value="workout">
          <WorkoutView day={resolvedDay} />
        </TabsContent>
        <TabsContent value="meal">
          <MealView day={resolvedDay} onSwap={applySwap} />
        </TabsContent>
        <TabsContent value="sleep">
          <SleepView day={resolvedDay} />
        </TabsContent>
        <TabsContent value="shopping">
          <ShoppingView swaps={swaps} />
        </TabsContent>
        <TabsContent value="menu">
          <MenuLibraryView />
        </TabsContent>
      </main>
    </Tabs>
  );
}
```

> หมายเหตุ: ไฟล์นี้ import `DAY_ORDER` จาก `@/lib/tracking` ซึ่งสร้างใน Task 2 — Task 1 ต้องสร้าง stub ของ `DAY_ORDER` ก่อน **หรือ** เรียงให้ Task 2 ทำก่อน Task 1. **เพื่อความง่าย: ใน Task 1 ให้สร้าง `src/lib/tracking.ts` ที่มีแค่ `DAY_ORDER` + `dayKeyForDate` ไปก่อน** (Task 2 จะเติมที่เหลือ + เทสต์). โค้ด:

```ts
// src/lib/tracking.ts (เริ่มต้น — Task 2 จะเติมต่อ)
import type { DayKey, ISODate } from "@/data/types";

/** index 0..6 = อาทิตย์..เสาร์ (ตรงกับ Date.getDay()) */
export const DAY_ORDER: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** "YYYY-MM-DD" → DayKey */
export function dayKeyForDate(iso: ISODate): DayKey {
  const [y, m, d] = iso.split("-").map(Number);
  return DAY_ORDER[new Date(y, m - 1, d).getDay()];
}
```

- [ ] **Step 6: แก้ `src/components/views/shopping-view.tsx` ให้ใช้ store**

เปลี่ยน import (ลบ React state + storage):

```tsx
// ลบ: import { getChecked, setChecked, clearChecked } from "@/lib/storage";
import { useAppStore } from "@/lib/store";
```

แทนที่ตัว state + handlers (บรรทัด ~26-47) ด้วย:

```tsx
  const checked = useAppStore((s) => s.checked);
  const toggleChecked = useAppStore((s) => s.toggleChecked);
  const clearChecked = useAppStore((s) => s.clearChecked);

  const toggle = (key: string, _value: boolean) => toggleChecked(key);
  const reset = () => clearChecked();
```

(ส่วนที่เหลือใช้ `checked`/`toggle`/`reset` เหมือนเดิม — `React.useEffect` และ `setCheckedState` ถูกลบทิ้ง; ยังต้อง `import * as React` สำหรับ `useMemo`)

- [ ] **Step 7: type-check + เทสต์ + รันแอป**

Run: `bun run build`
Expected: build ผ่าน (ไม่มี import storage.ts ค้าง)

Run: `bun test src/lib`
Expected: PASS ทั้งหมด (เทสต์เดิมไม่พึ่ง storage.ts)

ตรวจในเบราว์เซอร์ (dev server): สลับเมนู + ติ๊กของซื้อ + เลือกวัน → รีเฟรชแล้วค่าคงอยู่ (persist); ไม่มี hydration warning ใน console

- [ ] **Step 8: commit**

```bash
git add package.json bun.lock src/data/types.ts src/lib/store.ts src/lib/tracking.ts src/components/routine-app.tsx src/components/views/shopping-view.tsx
git rm src/lib/storage.ts
git commit -m "feat(store): zustand persist store, migrate off storage.ts"
```

---

## Task 2: tracking.ts pure logic (TDD)

เติมฟังก์ชันคำนวณใน `tracking.ts` (ต่อจาก stub ของ Task 1) + เทสต์

**Files:**
- Modify: `src/lib/tracking.ts`
- Test: `src/lib/tracking.test.ts`

**Interfaces:**
- Consumes: `DAY_ORDER`, `dayKeyForDate` (จาก Task 1), `week`, `profile`, `water`
- Produces: `WATER_TARGET_ML`, `toISODate(d: Date): ISODate`, `weightSeries(log)`, `effectiveWeight(log, fallbackKg)`, `effectiveProfile(base, override, log)`, `dayAdherence(day, dayLog?, waterTargetMl?)`, `computeStreak(log, week, todayISO, waterTargetMl?, threshold?)`, `daysHitInLast(log, week, todayISO, n, waterTargetMl?, threshold?)`

- [ ] **Step 1: เขียนเทสต์ `src/lib/tracking.test.ts`**

```ts
import { describe, it, expect } from "bun:test";
import { week } from "@/data/week";
import { profile } from "@/data/profile";
import {
  dayKeyForDate,
  effectiveWeight,
  effectiveProfile,
  dayAdherence,
  computeStreak,
  daysHitInLast,
  WATER_TARGET_ML,
} from "./tracking";
import type { DayLog, ISODate } from "@/data/types";

describe("dayKeyForDate", () => {
  it("2026-06-21 = อาทิตย์ (sun)", () => {
    expect(dayKeyForDate("2026-06-21")).toBe("sun");
  });
  it("2026-06-22 = จันทร์ (mon)", () => {
    expect(dayKeyForDate("2026-06-22")).toBe("mon");
  });
});

describe("effectiveWeight", () => {
  it("เลือก entry วันที่ล่าสุด", () => {
    const log = {
      "2026-06-01": { weightKg: 77 },
      "2026-06-21": { weightKg: 75 },
    };
    expect(effectiveWeight(log, 70)).toBe(75);
  });
  it("ไม่มีข้อมูล → fallback", () => {
    expect(effectiveWeight({}, 70)).toBe(70);
  });
});

describe("effectiveProfile", () => {
  it("merge override + น้ำหนักล่าสุดจาก log", () => {
    const eff = effectiveProfile(
      profile,
      { goal: "เพิ่มกล้ามล้วน", heightCm: 170 },
      { "2026-06-21": { weightKg: 73 } }
    );
    expect(eff.weightKg).toBe(73);
    expect(eff.goal).toBe("เพิ่มกล้ามล้วน");
    expect(eff.heightCm).toBe(170);
    expect(eff.age).toBe(profile.age);
  });
});

describe("dayAdherence", () => {
  it("วันเล่นเวต (จันทร์): 4 มื้อ + เล่น + น้ำ = total 6", () => {
    const mon = week.find((d) => d.key === "mon")!;
    const dayLog: DayLog = { meals: { 0: true, 1: true }, workoutDone: true, waterMl: 1500 };
    expect(dayAdherence(mon, dayLog, WATER_TARGET_ML)).toEqual({ done: 3, total: 6, pct: 50 });
  });
  it("วันพัก (อาทิตย์) ทำครบ = 100%", () => {
    const sun = week.find((d) => d.key === "sun")!;
    const dayLog: DayLog = { meals: { 0: true, 1: true, 2: true, 3: true }, waterMl: 3000 };
    const a = dayAdherence(sun, dayLog, WATER_TARGET_ML);
    expect(a.pct).toBe(100);
  });
  it("ไม่มี log = 0%", () => {
    const sun = week.find((d) => d.key === "sun")!;
    expect(dayAdherence(sun, undefined, WATER_TARGET_ML).pct).toBe(0);
  });
});

describe("computeStreak / daysHitInLast", () => {
  const full = { meals: { 0: true, 1: true, 2: true, 3: true }, waterMl: 3000 };
  const log: Record<ISODate, DayLog> = {
    "2026-06-21": full, // อา (rest, total 5) 100%
    "2026-06-20": full, // ส (rest) 100%
    // 2026-06-19 (ศ) ไม่มี log → หยุดสตรีค
  };
  it("สตรีคนับวันต่อเนื่องที่ ≥80%", () => {
    expect(computeStreak(log, week, "2026-06-21", WATER_TARGET_ML)).toBe(2);
  });
  it("ทำครบใน 7 วันล่าสุด", () => {
    expect(daysHitInLast(log, week, "2026-06-21", 7, WATER_TARGET_ML)).toBe(2);
  });
});
```

- [ ] **Step 2: รันเทสต์ ให้ fail**

Run: `bun test src/lib/tracking.test.ts`
Expected: FAIL (`effectiveWeight`/`dayAdherence`/… ไม่ถูก export)

- [ ] **Step 3: เติมฟังก์ชันใน `src/lib/tracking.ts`**

แทนที่ทั้งไฟล์ด้วย (รวม stub เดิมจาก Task 1):

```ts
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
```

- [ ] **Step 4: รันเทสต์ ให้ผ่าน**

Run: `bun test src/lib`
Expected: PASS ทั้งหมด (รวมเทสต์เดิม)

- [ ] **Step 5: commit**

```bash
git add src/lib/tracking.ts src/lib/tracking.test.ts
git commit -m "feat(tracking): pure logic for weight/adherence/streak (TDD)"
```

---

## Task 3: เป้าตามน้ำหนัก + หน้า "ฉัน" + กราฟน้ำหนัก

**Files:**
- Create: `src/components/views/me-view.tsx`, `src/components/weight-trend.tsx`
- Modify: `src/components/profile-header.tsx`, `src/components/views/meal-view.tsx`, `src/components/routine-app.tsx`

**Interfaces:**
- Consumes: `effectiveProfile`, `weightSeries`, `dayAdherence`, `computeStreak`, `daysHitInLast`, `dayKeyForDate`, `toISODate`, `WATER_TARGET_ML` (Task 2); `dailyTarget` (`@/lib/nutrition`); `useAppStore`
- Produces: `<MeView todayISO onBack />`, `<WeightTrend series />`, `ProfileHeader({ profile, onOpen })`, `MealView` รับ prop `profile`

- [ ] **Step 1: สร้าง `src/components/weight-trend.tsx`**

```tsx
import type { ISODate } from "@/data/types";

/** sparkline น้ำหนัก (SVG, ไม่ใช้ไลบรารีนอก) */
export function WeightTrend({
  series,
}: {
  series: { date: ISODate; kg: number }[];
}) {
  if (series.length < 2) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        บันทึกน้ำหนักอย่างน้อย 2 วันเพื่อดูเทรนด์
      </p>
    );
  }
  const w = 300;
  const h = 80;
  const pad = 6;
  const kgs = series.map((s) => s.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const range = max - min || 1;
  const n = series.length;
  const x = (i: number) => pad + (i / (n - 1)) * (w - 2 * pad);
  const y = (kg: number) => pad + (1 - (kg - min) / range) * (h - 2 * pad);
  const points = series.map((s, i) => `${x(i)},${y(s.kg)}`).join(" ");
  const first = series[0];
  const last = series[n - 1];
  const delta = Math.round((last.kg - first.kg) * 10) / 10;

  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full text-primary"
        preserveAspectRatio="none"
        role="img"
        aria-label="กราฟแนวโน้มน้ำหนัก"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {series.map((s, i) => (
          <circle key={i} cx={x(i)} cy={y(s.kg)} r={2} className="fill-primary" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground tnum">
        <span>{first.kg} กก.</span>
        <span
          className={
            delta < 0 ? "text-primary" : delta > 0 ? "text-amber-500" : ""
          }
        >
          {delta > 0 ? "+" : ""}
          {delta} กก.
        </span>
        <span>{last.kg} กก.</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: สร้าง `src/components/views/me-view.tsx`**

```tsx
"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { profile, week } from "@/data";
import { useAppStore } from "@/lib/store";
import {
  effectiveProfile,
  weightSeries,
  dayAdherence,
  computeStreak,
  daysHitInLast,
  dayKeyForDate,
  WATER_TARGET_ML,
} from "@/lib/tracking";
import { dailyTarget } from "@/lib/nutrition";
import { WeightTrend } from "@/components/weight-trend";
import { NutritionStrip } from "@/components/nutrition-strip";
import { Button } from "@/components/ui/button";

const DAY_TYPE_LABEL: Record<string, string> = {
  weights: "เล่นเวต",
  cardio: "คาร์ดิโอ",
  rest: "พัก",
};

export function MeView({
  todayISO,
  onBack,
}: {
  todayISO: string;
  onBack: () => void;
}) {
  const log = useAppStore((s) => s.log);
  const profileOverride = useAppStore((s) => s.profileOverride);
  const logWeight = useAppStore((s) => s.logWeight);
  const setProfileField = useAppStore((s) => s.setProfileField);

  const eff = effectiveProfile(profile, profileOverride, log);
  const series = weightSeries(log);
  const todayDay =
    week.find((d) => d.key === dayKeyForDate(todayISO)) ?? week[0];
  const adh = dayAdherence(todayDay, log[todayISO], WATER_TARGET_ML);
  const streak = computeStreak(log, week, todayISO);
  const hit7 = daysHitInLast(log, week, todayISO, 7);
  const target = dailyTarget(eff, todayDay.type);

  const [weightInput, setWeightInput] = React.useState<string>(
    log[todayISO]?.weightKg != null ? String(log[todayISO]?.weightKg) : ""
  );

  const saveWeight = () => {
    const kg = parseFloat(weightInput);
    if (!Number.isNaN(kg) && kg > 0) logWeight(todayISO, kg);
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-primary"
      >
        <ChevronLeft className="size-4" />
        กลับ
      </button>

      {/* น้ำหนัก */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">น้ำหนัก</h3>
        <p className="mt-1 text-xs text-muted-foreground tnum">
          ปัจจุบัน {eff.weightKg} กก.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="น้ำหนักวันนี้ (กก.)"
            className="tnum w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <Button onClick={saveWeight} size="sm">
            บันทึก
          </Button>
        </div>
        <WeightTrend series={series} />
      </section>

      {/* ความสม่ำเสมอ */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">ความสม่ำเสมอวันนี้</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="tnum text-3xl font-bold">{adh.pct}%</span>
          <span className="text-xs text-muted-foreground tnum">
            ({adh.done}/{adh.total} อย่าง)
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${adh.pct}%` }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground tnum">
          <span>🔥 สตรีค {streak} วัน</span>
          <span>ทำครบ {hit7}/7 วันล่าสุด</span>
        </div>
      </section>

      {/* เป้าวันนี้ */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">
          เป้าวันนี้ ({DAY_TYPE_LABEL[todayDay.type]})
        </h3>
        <NutritionStrip macros={target} />
      </section>

      {/* แก้โปรไฟล์ */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">โปรไฟล์</h3>
        <div className="mt-3 space-y-3">
          <ProfileField
            label="เป้าหมาย"
            value={eff.goal}
            onCommit={(v) => setProfileField("goal", v)}
          />
          <ProfileField
            label="ส่วนสูง (ซม.)"
            type="number"
            value={String(eff.heightCm)}
            onCommit={(v) => setProfileField("heightCm", Number(v) || eff.heightCm)}
          />
          <ProfileField
            label="อายุ (ปี)"
            type="number"
            value={String(eff.age)}
            onCommit={(v) => setProfileField("age", Number(v) || eff.age)}
          />
          <ProfileField
            label="ช่วงเล่น"
            value={eff.workoutWindow}
            onCommit={(v) => setProfileField("workoutWindow", v)}
          />
        </div>
      </section>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onCommit,
  type = "text",
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        defaultValue={value}
        onBlur={(e) => onCommit(e.target.value)}
        className="tnum mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}
```

- [ ] **Step 3: แก้ `src/components/profile-header.tsx` (รับ profile + กดเปิด)**

```tsx
import type { Profile } from "@/data/types";
import { ThemeToggle } from "@/components/theme-toggle";

export function ProfileHeader({
  profile,
  onOpen,
}: {
  profile: Profile;
  onOpen?: () => void;
}) {
  return (
    <header className="border-b border-border pt-safe">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 text-left"
        >
          <h1 className="truncate text-base font-bold tracking-tight">
            รูทีนฟิตเนสรายสัปดาห์
          </h1>
          <p className="truncate text-xs text-muted-foreground tnum">
            {profile.sex} · {profile.age} ปี · {profile.weightKg} กก. ·{" "}
            {profile.goal}
          </p>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: แก้ `src/components/views/meal-view.tsx` ให้รับ `profile` prop**

เปลี่ยน import (เอา `profile` ออกจาก `@/data` แล้วรับเป็น prop):

```tsx
import type { Profile, ResolvedDay } from "@/data/types";
import { waterTip, water } from "@/data";
import { sumMacros, dailyTarget } from "@/lib/nutrition";
```

แก้ signature + ใช้ prop:

```tsx
export function MealView({
  day,
  profile,
  onSwap,
}: {
  day: ResolvedDay;
  profile: Profile;
  onSwap: (mealIndex: number, recipeId: string) => void;
}) {
  // ...
  const total = sumMacros(day.meals.map((m) => m.macros));
  const target = dailyTarget(profile, day.type);
```

(ส่วนอื่นคงเดิม)

- [ ] **Step 5: แก้ `src/components/routine-app.tsx` — effProfile + หน้า "ฉัน"**

เพิ่ม import:

```tsx
import { profile } from "@/data";
import { effectiveProfile, toISODate } from "@/lib/tracking";
import { MeView } from "@/components/views/me-view";
```

เพิ่ม selectors + ค่าที่คำนวณ (ในตัวฟังก์ชัน ก่อน gate):

```tsx
  const profileOverride = useAppStore((s) => s.profileOverride);
  const log = useAppStore((s) => s.log);
```

หลัง gate (หลังบรรทัด `const day = ...`):

```tsx
  const effProfile = effectiveProfile(profile, profileOverride, log);
  const todayISO = toISODate(new Date());
```

เปลี่ยน `<ProfileHeader />` เป็น:

```tsx
        <ProfileHeader profile={effProfile} onOpen={() => handleTab("me")} />
```

เปลี่ยน `<MealView day={resolvedDay} onSwap={applySwap} />` เป็น:

```tsx
          <MealView day={resolvedDay} profile={effProfile} onSwap={applySwap} />
```

เพิ่มหลังบล็อก `<TabsContent value="menu">…</TabsContent>` (ภายใน `<main>`):

```tsx
        {tab === "me" && (
          <MeView todayISO={todayISO} onBack={() => handleTab("routine")} />
        )}
```

- [ ] **Step 6: build + เทสต์ + ตรวจเบราว์เซอร์**

Run: `bun run build` → ผ่าน
Run: `bun test src/lib` → PASS
ตรวจ: แตะแถบโปรไฟล์ → เปิดหน้า "ฉัน"; บันทึกน้ำหนัก → "ปัจจุบัน" เปลี่ยน + กล่องสรุปเป้าในแท็บอาหารเปลี่ยนตาม; บันทึก ≥2 วันเห็นกราฟ; แก้โปรไฟล์แล้วค่าในหัวเปลี่ยน

- [ ] **Step 7: commit**

```bash
git add src/components/weight-trend.tsx src/components/views/me-view.tsx src/components/profile-header.tsx src/components/views/meal-view.tsx src/components/routine-app.tsx
git commit -m "feat(tracking): me screen — weight log, trend, targets-by-weight, profile edit"
```

---

## Task 4: ติ๊กทำเสร็จรายวัน (มื้อ + เล่นเสร็จ + น้ำ)

**Files:**
- Modify: `src/components/meal-card.tsx`, `src/components/views/meal-view.tsx`, `src/components/views/workout-view.tsx`, `src/components/routine-app.tsx`

**Interfaces:**
- Consumes: store actions `toggleMeal`, `addWater`, `setWorkoutDone`; `log`; `todayISO`/`todayKey`
- Produces: MealCard รับ `done`/`onToggleDone`/`showDone`; MealView รับ `dateLog`/`isToday`/`onToggleMeal`/`onAddWater`; WorkoutView รับ `done`/`isToday`/`onToggleDone`

- [ ] **Step 1: แก้ `src/components/meal-card.tsx` — checkbox "กินแล้ว"**

เพิ่ม import:

```tsx
import { Checkbox } from "@/components/ui/checkbox";
```

เพิ่ม props ใน signature:

```tsx
export function MealCard({
  meal,
  onSwap,
  done = false,
  onToggleDone,
  showDone = false,
}: {
  meal: Meal;
  onSwap?: (recipeId: string) => void;
  done?: boolean;
  onToggleDone?: () => void;
  showDone?: boolean;
}) {
```

เพิ่มหลัง `<TagRow tags={meal.tags} />` (ก่อนบล็อกสลับเมนู):

```tsx
      {showDone && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-border pt-3 text-sm">
          <Checkbox checked={done} onCheckedChange={() => onToggleDone?.()} />
          <span className={done ? "text-muted-foreground line-through" : ""}>
            กินแล้ว
          </span>
        </label>
      )}
```

- [ ] **Step 2: แก้ `src/components/views/meal-view.tsx` — ส่ง props ติ๊กมื้อ + ตัวนับน้ำ**

เพิ่ม import:

```tsx
import { Droplets, Minus, Plus } from "lucide-react";
import type { DayLog } from "@/data/types";
import { Button } from "@/components/ui/button";
```

ขยาย signature:

```tsx
export function MealView({
  day,
  profile,
  onSwap,
  dateLog,
  isToday,
  onToggleMeal,
  onAddWater,
}: {
  day: ResolvedDay;
  profile: Profile;
  onSwap: (mealIndex: number, recipeId: string) => void;
  dateLog?: DayLog;
  isToday: boolean;
  onToggleMeal: (index: number) => void;
  onAddWater: (deltaMl: number) => void;
}) {
```

ในกล่องน้ำ เพิ่มตัวนับ (เฉพาะวันนี้) — หลังย่อหน้า `waterTip`:

```tsx
          {isToday && (
            <div className="mt-2 flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => onAddWater(-1500)}
                aria-label="ลดน้ำ 1 ขวด"
              >
                <Minus className="size-4" />
              </Button>
              <span className="tnum text-sm font-semibold">
                {((dateLog?.waterMl ?? 0) / 1000).toFixed(1)} /{" "}
                {water.litersPerDay} ล.
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => onAddWater(1500)}
                aria-label="เพิ่มน้ำ 1 ขวด"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          )}
```

ส่ง props ติ๊กให้การ์ดมื้อ:

```tsx
          <MealCard
            key={index}
            meal={meal}
            onSwap={(recipeId) => onSwap(index, recipeId)}
            showDone={isToday}
            done={!!dateLog?.meals?.[index]}
            onToggleDone={() => onToggleMeal(index)}
          />
```

- [ ] **Step 3: แก้ `src/components/views/workout-view.tsx` — toggle "เล่นเสร็จ"**

เพิ่ม import:

```tsx
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
```

ขยาย signature:

```tsx
export function WorkoutView({
  day,
  done = false,
  isToday = false,
  onToggleDone,
}: {
  day: ResolvedDay;
  done?: boolean;
  isToday?: boolean;
  onToggleDone?: () => void;
}) {
```

ในการ์ดหัวข้อ (กล่อง title+เวลา) เพิ่มปุ่มหลังย่อหน้าเวลา (เฉพาะวันนี้):

```tsx
        {isToday && (
          <Button
            variant={done ? "default" : "outline"}
            size="sm"
            className="mt-3 w-full gap-1.5"
            onClick={onToggleDone}
          >
            <Check className="size-4" />
            {done ? "เล่นเสร็จแล้ว" : "ทำเครื่องหมายว่าเล่นเสร็จ"}
          </Button>
        )}
```

- [ ] **Step 4: แก้ `src/components/routine-app.tsx` — เดินสาย props ติ๊ก**

เพิ่ม selectors:

```tsx
  const toggleMeal = useAppStore((s) => s.toggleMeal);
  const addWater = useAppStore((s) => s.addWater);
  const setWorkoutDone = useAppStore((s) => s.setWorkoutDone);
```

หลัง `const todayISO = toISODate(new Date());` เพิ่ม:

```tsx
  const isToday = selected === today;
  const dateLog = log[todayISO];
```

อัปเดต `<WorkoutView>`:

```tsx
        <TabsContent value="workout">
          <WorkoutView
            day={resolvedDay}
            done={!!dateLog?.workoutDone}
            isToday={isToday}
            onToggleDone={() => setWorkoutDone(todayISO, !dateLog?.workoutDone)}
          />
        </TabsContent>
```

อัปเดต `<MealView>`:

```tsx
        <TabsContent value="meal">
          <MealView
            day={resolvedDay}
            profile={effProfile}
            onSwap={applySwap}
            dateLog={dateLog}
            isToday={isToday}
            onToggleMeal={(i) => toggleMeal(todayISO, i)}
            onAddWater={(d) => addWater(todayISO, d)}
          />
        </TabsContent>
```

- [ ] **Step 5: build + เทสต์ + ตรวจเบราว์เซอร์**

Run: `bun run build` → ผ่าน
Run: `bun test src/lib` → PASS
ตรวจ (วันนี้): ติ๊ก "กินแล้ว" ในการ์ดมื้อ, กด "เล่นเสร็จ" ในแท็บออกกำลัง, กด +/− น้ำ → เปิดหน้า "ฉัน" เห็น % / สตรีคขยับ; เลือกวันอื่น (ไม่ใช่วันนี้) → ไม่มีปุ่มติ๊ก; รีเฟรชแล้วค่าคงอยู่

- [ ] **Step 6: commit**

```bash
git add src/components/meal-card.tsx src/components/views/meal-view.tsx src/components/views/workout-view.tsx src/components/routine-app.tsx
git commit -m "feat(tracking): daily check-offs — meals, workout done, water counter"
```

---

## Self-Review (ผู้เขียนแผนตรวจเองแล้ว)

**Spec coverage:**
- บันทึกน้ำหนัก + กราฟ → Task 2 (`weightSeries`) + Task 3 (me-view + WeightTrend) ✓
- น้ำหนักล่าสุด = ตัวตั้งเป้า → Task 2 (`effectiveProfile`) + Task 3 (effProfile → `dailyTarget` ใน meal-view + me-view) ✓
- แก้โปรไฟล์ในแอป → Task 1 (`setProfileField`) + Task 3 (ฟอร์ม) ✓
- ติ๊กทำเสร็จ + น้ำ + adherence/streak → Task 2 (`dayAdherence`/`computeStreak`/`daysHitInLast`) + Task 4 (UI) + Task 3 (สรุปใน me-view) ✓
- หน้า "ฉัน" เปิดจากโปรไฟล์ → Task 3 ✓
- Zustand persist + ลบ storage.ts + hydration guard → Task 1 ✓ (Global Constraints)
- เฉพาะวันนี้ติ๊กได้ → Task 4 (`isToday`) ✓

**Placeholder scan:** ไม่มี TBD/TODO — โค้ดครบทุก step (Task 1 สร้าง tracking.ts stub แล้ว Task 2 แทนที่ทั้งไฟล์ ระบุชัด) ✓

**Type consistency:** `useAppStore`, actions, `ISODate`/`DayLog`/`ProfileOverride`, `effectiveProfile`/`dayAdherence`/`computeStreak`/`daysHitInLast`/`toISODate`/`dayKeyForDate`/`WATER_TARGET_ML`, `ProfileHeader({profile,onOpen})`, `MealView({day,profile,onSwap,dateLog,isToday,onToggleMeal,onAddWater})`, `MealCard({…,done,onToggleDone,showDone})`, `WorkoutView({day,done,isToday,onToggleDone})`, `MeView({todayISO,onBack})`, `WeightTrend({series})` — ชื่อ/ลายเซ็นตรงกันทุก task ✓

**Scope:** หนึ่ง feature เชื่อมโยงกัน (4 tasks) เหมาะกับ 1 แผน ✓
