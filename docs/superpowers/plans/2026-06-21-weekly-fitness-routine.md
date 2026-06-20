# Weekly Fitness Routine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างเว็บแอปส่วนตัวดูตารางรูทีนฟิตเนส/อาหาร/นอน/รายการซื้อของรายสัปดาห์ เปิดบนมือถือเป็นหลัก

**Architecture:** Client-only Next.js (App Router) static-export-able app. ข้อมูลทั้งหมดอยู่ใน `src/data/*` (typed, แก้มือง่าย). ตรรกะคำนวณ (ไทม์ไลน์, ยอดซื้อของ) อยู่ใน `src/lib/*` แบบ pure functions ที่ unit-test ได้ด้วย `bun test`. UI เป็น component แยกตามแท็บ. state ที่ persist (ธีม/วันที่เลือก/ติ๊กซื้อของ) เก็บใน localStorage.

**Tech Stack:** Next.js + TypeScript + Tailwind CSS + shadcn/ui + Bun. `bun test` สำหรับ unit test ตรรกะ.

## Global Constraints
- โทนสี **ขาว-ดำล้วน ไม่มีสีเน้น** — แยกลำดับชั้นด้วย weight/border/พื้นเทาอ่อน/ระยะห่าง (shadcn base color = neutral)
- รองรับ **Light + Dark + ปุ่มสลับ**
- ฟอนต์ sans-serif อ่านสบาย รองรับไทย
- เลย์เอาต์ **mobile-first** (ผสมไทม์ไลน์+การ์ด)
- ข้อมูลแยกเป็น object/array ใน `src/data` แก้เพิ่ม-ลดเองได้
- โปรไฟล์: ชาย 25 · 167ซม. · เพิ่มกล้าม-ลดไขมัน · เล่น 19:00–20:00
- ภาษาไทยทั้ง UI และเนื้อหา

---

### Task 1: Scaffold โปรเจกต์ (Next.js + Tailwind + Bun + shadcn)

**Files:**
- Create: ทั้งโครง Next.js (`package.json`, `src/app/*`, `tsconfig.json`, ฯลฯ)
- Modify: `next.config.*` (เพิ่ม `output: 'export'`), `.gitignore`

**Steps:**
- [ ] ย้าย `docs/` ออกชั่วคราว → scaffold create-next-app ใน root (ts, tailwind, app router, src-dir, alias `@/*`, ใช้ bun) → ย้าย `docs/` กลับ
- [ ] `bunx shadcn@latest init` แบบ defaults, base color = **neutral**
- [ ] เพิ่มคอมโพเนนต์ shadcn: `button card tabs switch separator badge scroll-area`
- [ ] ตั้งค่า static export ใน `next.config` (`output: 'export'`, `images.unoptimized: true`)
- [ ] รัน `bun run build` ให้ผ่าน
- [ ] Commit: `chore: scaffold next.js + tailwind + shadcn (bun)`

**Acceptance:** `bun run dev` เปิดได้, `bun run build` ผ่าน

---

### Task 2: Types + Data (เนื้อหาเริ่มต้น 7 วัน + ซื้อของ)

**Files:**
- Create: `src/data/types.ts`, `src/data/profile.ts`, `src/data/week.ts`, `src/data/shopping.ts`, `src/data/index.ts`

**Interfaces (Produces):** types ตาม spec — `Profile, DayType, Exercise, Meal, Workout, Sleep, Day, ShopCategory, ShopItem`. export `profile: Profile`, `week: Day[]` (7 รายการ จ–อา), `shopping: ShopItem[]`, `waterTip`, `sleepTips: string[]`.

**Steps:**
- [ ] เขียน `types.ts` (ตาม spec)
- [ ] เขียน `profile.ts`
- [ ] เขียน `week.ts` — 7 วัน: จ=Full Body A, อ=คาร์ดิโอ, พ=Full Body B, พฤ=คาร์ดิโอ, ศ=Full Body C, ส=พัก/คาร์ดิโอเบา, อา=พัก. แต่ละวันมี warmup/exercises/cooldown (วันเล่น), meals (3-5 มื้อ พร้อม steps + tags ก่อน/หลังเล่น), sleep
- [ ] เขียน `shopping.ts` — รายการ 6 หมวด พร้อม qty/price(บาท)/recurring + `waterTip`, `sleepTips`
- [ ] `index.ts` re-export
- [ ] Commit: `feat: add typed data model + starter week & shopping content`

**Acceptance:** `import { week, shopping } from '@/data'` ใช้งานได้, type ถูกต้อง

---

### Task 3: `src/lib/timeline.ts` (TDD ด้วย bun test)

**Files:**
- Create: `src/lib/timeline.ts`, `src/lib/timeline.test.ts`

**Interfaces (Produces):**
```ts
type TimelineKind = 'wake'|'meal'|'workout'|'winddown'|'bedtime'
type TimelineEntry = { time: string; minutes: number; kind: TimelineKind; meal?: Meal; workout?: Workout; label?: string }
function toMinutes(hhmm: string): number
function buildTimeline(day: Day): TimelineEntry[]
```

**Steps:**
- [ ] **Write failing tests** (`timeline.test.ts`):
```ts
import { describe, it, expect } from 'bun:test'
import { toMinutes, buildTimeline } from './timeline'
import type { Day } from '@/data/types'

const weightDay: Day = {
  key:'mon', label:'จันทร์', short:'จ', type:'weights', title:'Full Body A',
  workout:{ time:{start:'19:00',end:'20:00'}, warmup:['x'], exercises:[], cooldown:['y'] },
  meals:[
    { time:'07:00', name:'เช้า', menu:'a', steps:['1'], tags:[] },
    { time:'20:30', name:'หลังเล่น', menu:'b', steps:['1'], tags:['หลังเล่น = ซ่อมกล้าม'] },
  ],
  sleep:{ bedtime:'23:00', wake:'06:30', hours:7.5, note:'n' },
}
const restDay: Day = { ...weightDay, type:'rest', title:'วันพัก', workout:undefined }

describe('toMinutes', () => {
  it('แปลง HH:MM เป็นนาที', () => { expect(toMinutes('06:30')).toBe(390) })
})
describe('buildTimeline', () => {
  it('เรียงตามเวลา: ตื่นมาก่อน เข้านอนท้ายสุด', () => {
    const t = buildTimeline(weightDay)
    expect(t[0].kind).toBe('wake')
    expect(t[t.length-1].kind).toBe('bedtime')
    const mins = t.map(e=>e.minutes)
    expect([...mins].sort((a,b)=>a-b)).toEqual(mins)
  })
  it('วันเวตมีบล็อก workout แทรกก่อนมื้อหลังเล่น', () => {
    const t = buildTimeline(weightDay)
    const wi = t.findIndex(e=>e.kind==='workout')
    const mi = t.findIndex(e=>e.meal?.name==='หลังเล่น')
    expect(wi).toBeGreaterThan(-1)
    expect(wi).toBeLessThan(mi)
  })
  it('วันพักไม่มีบล็อก workout', () => {
    expect(buildTimeline(restDay).some(e=>e.kind==='workout')).toBe(false)
  })
  it('มี winddown ก่อน bedtime', () => {
    const t = buildTimeline(weightDay)
    const wd = t.findIndex(e=>e.kind==='winddown'); const bt = t.findIndex(e=>e.kind==='bedtime')
    expect(wd).toBeGreaterThan(-1); expect(wd).toBeLessThan(bt)
  })
})
```
- [ ] รัน `bun test src/lib/timeline.test.ts` → ต้อง FAIL
- [ ] เขียน `timeline.ts`: `toMinutes`; `buildTimeline` รวม entry จาก wake(sleep.wake), meals, workout(ถ้ามี, time=start), winddown(= bedtime −30 นาที), bedtime(sleep.bedtime) แล้ว sort ตาม minutes (เสถียร)
- [ ] รัน `bun test` → PASS
- [ ] Commit: `feat: timeline builder with tests`

---

### Task 4: `src/lib/shopping.ts` (TDD ด้วย bun test)

**Files:**
- Create: `src/lib/shopping.ts`, `src/lib/shopping.test.ts`

**Interfaces (Produces):**
```ts
type ShoppingTotals = {
  byCategory: Record<string, number>
  grandTotal: number
  weeklyTotal: number   // recurring=false
  oneTimeTotal: number  // recurring=true
  perDay: number        // weeklyTotal/7
}
function shoppingTotals(items: ShopItem[]): ShoppingTotals
function groupByCategory(items: ShopItem[]): Record<string, ShopItem[]>
```

**Steps:**
- [ ] **Write failing tests:**
```ts
import { describe, it, expect } from 'bun:test'
import { shoppingTotals } from './shopping'
import type { ShopItem } from '@/data/types'
const items: ShopItem[] = [
  { name:'อกไก่', qty:'1กก', price:100, category:'โปรตีน', recurring:false },
  { name:'ไข่', qty:'30ฟอง', price:140, category:'โปรตีน', recurring:false },
  { name:'น้ำมันมะกอก', qty:'1ขวด', price:200, category:'เครื่องปรุง', recurring:true },
]
describe('shoppingTotals', () => {
  const t = shoppingTotals(items)
  it('รวมแต่ละหมวด', () => { expect(t.byCategory['โปรตีน']).toBe(240); expect(t.byCategory['เครื่องปรุง']).toBe(200) })
  it('รวมทั้งหมด', () => { expect(t.grandTotal).toBe(440) })
  it('งบสัปดาห์ = ไม่รวม recurring', () => { expect(t.weeklyTotal).toBe(240) })
  it('ของใช้นาน = recurring', () => { expect(t.oneTimeTotal).toBe(200) })
  it('เฉลี่ยต่อวัน = weekly/7', () => { expect(t.perDay).toBeCloseTo(240/7) })
})
```
- [ ] รัน `bun test src/lib/shopping.test.ts` → FAIL
- [ ] เขียน `shopping.ts` (`groupByCategory`, `shoppingTotals`)
- [ ] รัน `bun test` → PASS
- [ ] Commit: `feat: shopping totals with tests`

---

### Task 5: `src/lib/storage.ts` + ThemeProvider/Toggle

**Files:**
- Create: `src/lib/storage.ts`, `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx` (ครอบ provider, `suppressHydrationWarning`)

**Interfaces (Produces):**
```ts
function getChecked(): Record<string, boolean>
function setChecked(name: string, value: boolean): void
function getSelectedDay(): string | null
function setSelectedDay(key: string): void
```

**Steps:**
- [ ] เขียน `storage.ts` — guard `typeof window`, อ่าน/เขียน JSON ใน localStorage (key: `knot-gym:checked`, `knot-gym:day`)
- [ ] ThemeProvider (class strategy) + ThemeToggle (สลับ light/dark, persist) — ใช้ `next-themes` หรือ context เล็ก ๆ เอง (ขาว-ดำ ไม่มีสี)
- [ ] ครอบ layout, ปุ่ม toggle ใช้ไอคอนพระอาทิตย์/จันทร์ (มินิมอล)
- [ ] รัน `bun run build` ผ่าน (ไม่มี hydration error)
- [ ] Commit: `feat: localStorage helpers + theme toggle`

---

### Task 6: โครงหน้า — Header(โปรไฟล์) + DayPicker + Tabs shell

**Files:**
- Create: `src/components/profile-header.tsx`, `src/components/day-picker.tsx`, `src/components/routine-app.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `week` (Task 2), storage helpers (Task 5)
- Produces: `RoutineApp` client component ถือ state `selectedDayKey` + `activeTab`; ส่ง `day` ลง view ต่าง ๆ

**Steps:**
- [ ] `ProfileHeader` — ชื่อแอป + บรรทัดโปรไฟล์ (ชาย 25 · 167ซม. · เพิ่มกล้าม-ลดไขมัน) + ThemeToggle มุมขวา
- [ ] `DayPicker` — แถบ 7 ปุ่ม จ–อา (sticky บนสุด), ปุ่มวันที่เลือกเป็น inverted (ขาว-ดำ), ใต้ตัวอักษรมี dot/ป้ายประเภท (เวต/คาร์ดิโอ/พัก)
- [ ] `RoutineApp` — `'use client'`, init `selectedDayKey` จาก storage (fallback วันนี้/จันทร์), shadcn `Tabs` 5 แท็บ (📋 รูทีน / 🏋️ ออกกำลัง / 🍱 อาหาร / 😴 นอน / 🛒 ซื้อของ), เปลี่ยนวันแล้ว persist
- [ ] `page.tsx` render `<RoutineApp />`
- [ ] รัน dev + build ผ่าน
- [ ] Commit: `feat: app shell — header, day picker, tabs`

---

### Task 7: TimelineView (📋 รูทีน)

**Files:**
- Create: `src/components/views/timeline-view.tsx`, `src/components/timeline-entry-card.tsx`

**Steps:**
- [ ] `TimelineView({day})` ใช้ `buildTimeline(day)` แสดงเส้นไทม์ไลน์แนวตั้ง (เส้น + จุด) แต่ละ entry เป็นการ์ด
- [ ] การ์ดตามชนิด: wake/bedtime/winddown (เวลา+ป้าย), meal (เวลา+ชื่อ+เมนู+**step วิธีทำ**+tags), workout (เวลา+สรุปจำนวนท่า, ลิงก์/ปุ่มไปแท็บออกกำลัง)
- [ ] วันพัก: ไม่มีการ์ด workout (มาจาก buildTimeline)
- [ ] mobile-first, mono ขาว-ดำ
- [ ] Commit: `feat: timeline (routine) view`

---

### Task 8: WorkoutView (🏋️ ออกกำลัง)

**Files:** Create `src/components/views/workout-view.tsx`, `src/components/exercise-card.tsx`

**Steps:**
- [ ] ถ้า `day.type==='rest'` → แสดงข้อความวันพัก (มินิมอล)
- [ ] มิฉะนั้น: หัวข้อ title + เวลาเล่น, ส่วนวอร์มอัพ (list), การ์ดท่า (ชื่อ/กล้ามเนื้อ + เซ็ต×ครั้ง + พัก), ส่วนคูลดาวน์
- [ ] Commit: `feat: workout view`

---

### Task 9: MealView (🍱 อาหาร)

**Files:** Create `src/components/views/meal-view.tsx`, `src/components/meal-card.tsx`

**Steps:**
- [ ] แถบเตือนดื่มน้ำ (`waterTip`) ด้านบน
- [ ] การ์ดทุกมื้อเรียงตามเวลา: เวลา/ชื่อ/เมนู/**step 1-2-3**/tags
- [ ] Commit: `feat: meal view`

---

### Task 10: SleepView (😴 นอน)

**Files:** Create `src/components/views/sleep-view.tsx`

**Steps:**
- [ ] การ์ดสรุป: เข้านอน / ตื่น / จำนวน ชม. (เด่น) + โน้ตของวัน
- [ ] รายการทิปการนอน (`sleepTips`)
- [ ] Commit: `feat: sleep view`

---

### Task 11: ShoppingView (🛒 ซื้อของ)

**Files:** Create `src/components/views/shopping-view.tsx`, `src/components/shop-item-row.tsx`

**Steps:**
- [ ] `'use client'`: โหลด/บันทึกสถานะติ๊กจาก storage (Task 5); ใช้ `groupByCategory` + `shoppingTotals`
- [ ] แยก 2 กลุ่ม: "ของรายสัปดาห์" และ "ของใช้นาน (ซื้อครั้งเดียว)"; ในแต่ละกลุ่มแบ่งหมวด
- [ ] แต่ละแถว: checkbox + ชื่อ + ปริมาณ + ราคา; ติ๊กแล้ว **ขีดฆ่า** (line-through + จาง)
- [ ] ยอดรวมรายหมวด + ยอดรวมทั้งหมด
- [ ] สรุปเด่น: **งบสัปดาห์ถัดไป** (weeklyTotal) + **เฉลี่ยต่อวัน** (perDay) + ของใช้นาน (oneTimeTotal)
- [ ] Commit: `feat: shopping list view with persistent checks & totals`

---

### Task 12: Polish + verify

**Files:** Modify globals.css, components ตามจำเป็น

**Steps:**
- [ ] ปรับ mobile spacing/typography, sticky day picker, safe-area, แตะง่าย (≥44px)
- [ ] ตรวจ light/dark สลับครบทุกแท็บ
- [ ] `bun test` ผ่านทั้งหมด, `bun run build` ผ่าน
- [ ] ดูจริงด้วย browser preview (มือถือ viewport) ทุกแท็บ
- [ ] Commit: `style: mobile polish + final verification`

## Self-Review
- Spec coverage: แถบวัน ✓(T6) · 3 ประเภทวัน ✓(T2) · workout/meal/sleep data ✓(T2) · 5 แท็บ ✓(T7-11) · timeline ordering+workout insert+rest ✓(T3,7) · meal steps in timeline ✓(T7) · water reminder ✓(T9) · sleep tips ✓(T10) · shopping 6 หมวด/ราคา/ติ๊กขีดฆ่า/รวมหมวด+รวมทั้งหมด/แยก recurring/งบสัปดาห์/เฉลี่ยต่อวัน ✓(T4,11) · data แยกแก้ง่าย ✓(T2) · โปรไฟล์ ✓(T6) · ขาว-ดำ/light-dark/ฟอนต์/mobile ✓(constraints,T5,T12)
- Placeholder scan: ไม่มี TODO/TBD ในขั้น code; lib มี test+impl จริง
- Type consistency: `buildTimeline/toMinutes/shoppingTotals/groupByCategory` + storage helpers ชื่อตรงกันทุก task
