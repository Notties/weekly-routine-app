# Tier 1 — ติดตามผล: แก้โปรไฟล์ + บันทึกน้ำหนัก + ติ๊กทำเสร็จ (Zustand persist)

วันที่: 2026-06-21
สถานะ: รออนุมัติ

## เป้าหมาย

เปลี่ยนแอปจาก "แผนอ่านอย่างเดียว" เป็น "เครื่องมือที่บอกว่ากำลังเข้าเป้าหรือไม่":

1. **บันทึกน้ำหนักรายวัน + กราฟเทรนด์** — เก็บเป็น time series ตามวันที่จริง
2. **น้ำหนักล่าสุด = ตัวตั้งเป้าโภชนาการ** — `dailyTarget` คำนวณใหม่อัตโนมัติเมื่อบันทึกน้ำหนัก
3. **แก้โปรไฟล์ในแอป** (goal/ส่วนสูง/อายุ/ช่วงเล่น) ทับค่าตั้งต้นในโค้ด
4. **ติ๊ก "ทำเสร็จ" รายวัน** — มื้ออาหาร + เล่นเสร็จ + นับน้ำดื่ม + สรุป % วันนี้ + สตรีค
5. **หน้า "ฉัน"** เปิดจากแถบโปรไฟล์ด้านบน (รวมน้ำหนัก/กราฟ/สรุป/แก้โปรไฟล์)

## การตัดสินใจเชิงสถาปัตยกรรม

- **Zustand + persist middleware** เป็น state store เดียวของแอป (`name: "knot-gym"`)
- **รวม state เดิมเข้า store เดียวกัน** (selectedDay, swaps, checked) → **ลบ `src/lib/storage.ts`** และ useEffect โหลด state ใน `routine-app.tsx` ออก โค้ดสั้นลง มี persistence แบบเดียว
- ต้องเพิ่ม dependency `zustand` (`bun add zustand`)
- **น้ำหนักอยู่ใน log (time series) เท่านั้น** ไม่อยู่ใน profile override — "น้ำหนักปัจจุบัน" = entry ล่าสุด, fallback `profile.weightKg` (75)
- ตรรกะคำนวณทั้งหมดเป็น **ฟังก์ชันบริสุทธิ์** ใน `lib/tracking.ts` (รับ data เป็น args, ไม่แตะ store/localStorage) → เทสต์ TDD ได้เต็ม; store ทำหน้าที่ persist อย่างเดียว

> ข้อมูล localStorage เดิม (`knot-gym:swaps` ฯลฯ) จะไม่ย้ายเข้า store ใหม่ (`knot-gym` key เดียว) — แอปส่วนตัว ยอมรับการเริ่มใหม่ได้ ไม่ทำ migration (YAGNI)

ขอบเขตที่ **ไม่ทำ** รอบนี้: workout logging แบบเวต/ครั้ง (Tier 2), PWA/แจ้งเตือน (Tier 3), backfill น้ำหนักย้อนหลัง (v1 บันทึกของ"วันนี้")

## โมเดลข้อมูล

```ts
type ISODate = string; // "YYYY-MM-DD" (local date)

type DayLog = {
  weightKg?: number;              // น้ำหนักที่ชั่งวันนั้น
  meals?: Record<number, true>;   // index มื้อที่กินแล้ว (อิง meals[] ของ template วันนั้น)
  workoutDone?: boolean;
  waterMl?: number;               // สะสม
};

// แก้ได้ในหน้า "ฉัน" (weight ไม่อยู่ที่นี่ — อยู่ใน log)
type ProfileOverride = Partial<Pick<Profile, "goal" | "heightCm" | "age" | "workoutWindow">>;
```

## Store (`src/lib/store.ts` ใหม่ — Zustand + persist)

```ts
type AppState = {
  hasHydrated: boolean;
  selectedDay: DayKey | null;
  swaps: Record<string, string>;     // "<dayKey>:<index>" -> recipeId
  checked: Record<string, boolean>;  // คีย์รายการซื้อของ
  log: Record<ISODate, DayLog>;
  profileOverride: ProfileOverride;

  setSelectedDay(k: DayKey): void;
  setSwap(key: string, recipeId: string): void;
  clearSwap(key: string): void;
  toggleChecked(key: string): void;
  clearChecked(): void;
  logWeight(date: ISODate, kg: number): void;
  toggleMeal(date: ISODate, index: number): void;
  setWorkoutDone(date: ISODate, done: boolean): void;
  addWater(date: ISODate, deltaMl: number): void;   // เพิ่ม/ลด (กันไม่ให้ < 0)
  setProfileField<K extends keyof ProfileOverride>(field: K, value: ProfileOverride[K]): void;
};
```

- `persist` options: `name: "knot-gym"`, `partialize` เก็บเฉพาะ data (ไม่เก็บ `hasHydrated`/actions), `onRehydrateStorage` → ตั้ง `hasHydrated = true`
- **Hydration guard (สำคัญกับ static export):** `RoutineApp` แสดง skeleton/ว่างจนกว่า `hasHydrated === true` แล้วค่อย render เนื้อหา — กัน hydration mismatch ระหว่าง HTML ที่ pre-render (state ค่าเริ่มต้น) กับค่าจาก localStorage
- selectorต่าง ๆ ใช้ผ่าน hook `useAppStore(...)`

## ตรรกะบริสุทธิ์ (`src/lib/tracking.ts` ใหม่ + `tracking.test.ts`)

```ts
const WATER_TARGET_ML = water.litersPerDay * 1000; // 3000

/** วันที่ (ISO) → DayKey (อิง getDay()) */
function dayKeyForDate(iso: ISODate): DayKey;

/** น้ำหนักล่าสุดใน log (entry ที่มี weightKg, วันที่มากสุด) ไม่มี → fallback */
function effectiveWeight(log: Record<ISODate, DayLog>, fallbackKg: number): number;

/** profile ที่ใช้จริง: ค่าตั้งต้น + override + weightKg จาก log ล่าสุด */
function effectiveProfile(base: Profile, override: ProfileOverride, log): Profile;

/** ชุดข้อมูลกราฟน้ำหนัก เรียงวันที่จากเก่า→ใหม่ */
function weightSeries(log): { date: ISODate; kg: number }[];

/** ความสม่ำเสมอของวันนั้น: done/total/pct
 *  total = จำนวนมื้อ + (วันนั้นมี workout ? 1 : 0) + 1(น้ำ)
 *  done  = มื้อที่ติ๊ก + (workoutDone?1:0) + (waterMl>=target?1:0) */
function dayAdherence(day: Day, dayLog: DayLog | undefined, waterTargetMl: number): {
  done: number; total: number; pct: number;
};

/** สตรีค: นับวันต่อเนื่องย้อนจาก today (หรือ yesterday ถ้าวันนี้ยังไม่ถึงเกณฑ์) ที่ pct ≥ threshold */
function computeStreak(log, week: Day[], todayISO: ISODate, waterTargetMl: number, threshold?: number): number;

/** ทำครบกี่วันใน N วันล่าสุด (pct ≥ threshold) */
function daysHitInLast(log, week, todayISO, waterTargetMl, n: number, threshold?: number): number;
```

- threshold เริ่มต้น = **0.8**
- ฟังก์ชันเหล่านี้รับ `todayISO`/`week`/`log` เป็น args (ไม่เรียก `Date.now`) → เทสต์ด้วยอินพุตคงที่ได้

## เป้าโภชนาการที่อัปเดตตามน้ำหนัก

- `routine-app` คำนวณ `effProfile = effectiveProfile(profile, profileOverride, log)` แล้วส่งเป็น prop ลงไปยังจุดที่ต้องใช้
- `meal-view.tsx` เดิมใช้ `dailyTarget(profile, day.type)` → เปลี่ยนเป็นรับ `profile` prop (effProfile) แล้ว `dailyTarget(effProfile, day.type)`
- หน้า "ฉัน" ใช้ effProfile + effectiveWeight แสดงน้ำหนักปัจจุบัน/เป้า

## ติ๊กทำเสร็จ + น้ำ (เฉพาะ "วันนี้")

- **กฎ:** toggle ใช้งานได้เมื่อ `selectedDay === todayKey` เท่านั้น วันอื่นโชว์แผนอย่างเดียว (ไม่โชว์/disable toggle) — เลี่ยงการ map weekday↔วันที่ปฏิทิน
- `meal-card.tsx`: ถ้าเป็นวันนี้ แสดง checkbox "กินแล้ว" (ผูก `log[today].meals[index]`) — ส่ง `done`/`onToggle`/`interactive` เป็น prop (การ์ดยังไม่ผูก store ตรง ๆ)
- `workout-view.tsx`: ปุ่ม/แถบ "เล่นเสร็จ" (วันนี้ + วันที่มี workout)
- `meal-view.tsx` กล่องน้ำ: ปุ่ม +/− 1 ขวด (1.5 ล. = 1500 มล.) เข้าหาเป้า แสดง “x / 3 ล.” (วันนี้)
- การ์ดสรุปในแท็บอาหารยังโชว์มาโคร vs เป้าเหมือนเดิม (ตอนนี้เป้าอิงน้ำหนักล่าสุด)

## หน้า "ฉัน" (`src/components/views/me-view.tsx` ใหม่)

- เปิดโดยแตะ `profile-header.tsx` (เพิ่ม onClick → `setTab("me")`) — เป็น **tab ซ่อน** (value `"me"` ไม่อยู่ใน `TABS` ที่ render แถบ) มีปุ่มย้อนกลับ
- เนื้อหา:
  1. **น้ำหนัก**: ค่าปัจจุบัน + ช่องกรอกบันทึกน้ำหนักวันนี้ (`logWeight(today, kg)`)
  2. **กราฟเทรนด์** (`src/components/weight-trend.tsx` ใหม่): inline SVG sparkline จาก `weightSeries(log)` — ไม่ใช้ไลบรารีนอก (CSP/static-safe); ว่าง → ข้อความชวนเริ่มบันทึก
  3. **สรุปวันนี้**: % adherence (วงแหวน/แถบ) + done/total + สตรีค + "ทำครบ X/7 วันล่าสุด"
  4. **เป้าวันนี้**: kcal/P/C/F จาก effProfile (เชื่อมโยงน้ำหนักล่าสุด)
  5. **แก้โปรไฟล์**: ฟอร์ม goal/ส่วนสูง/อายุ/ช่วงเล่น → `setProfileField`
- ใช้สไตล์เดิม: `rounded-2xl border border-border bg-card p-4`, `tnum`

## ไฟล์ที่แตะ

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `package.json` | + `zustand` |
| `src/lib/store.ts` (ใหม่) | Zustand store + persist (state เดิม + log + profileOverride + actions) |
| `src/lib/tracking.ts` (ใหม่) | ฟังก์ชันบริสุทธิ์ (effectiveWeight/Profile, weightSeries, dayAdherence, computeStreak, daysHitInLast, dayKeyForDate) |
| `src/lib/tracking.test.ts` (ใหม่) | เทสต์ TDD ตรรกะข้างบน |
| `src/lib/storage.ts` | **ลบ** (ย้ายไป store) |
| `src/data/types.ts` | + `ISODate`, `DayLog`, `ProfileOverride` |
| `src/components/routine-app.tsx` | ใช้ store แทน useState/useEffect+storage; คำนวณ effProfile + todayKey; เพิ่ม tab ซ่อน `"me"`; ส่ง props ติ๊ก |
| `src/components/profile-header.tsx` | กดเปิดหน้า "ฉัน" (รับ onOpen) |
| `src/components/views/meal-view.tsx` | รับ `profile` prop (effProfile); กล่องน้ำเป็นตัวนับ; ส่ง done/onToggle ลงการ์ด |
| `src/components/meal-card.tsx` | checkbox "กินแล้ว" (วันนี้) ผ่าน props |
| `src/components/views/workout-view.tsx` | toggle "เล่นเสร็จ" (วันนี้) |
| `src/components/views/shopping-view.tsx` | ใช้ `checked`/`toggleChecked`/`clearChecked` จาก store แทน storage.ts |
| `src/components/views/me-view.tsx` (ใหม่) | หน้า "ฉัน" |
| `src/components/weight-trend.tsx` (ใหม่) | sparkline SVG |

## การทดสอบ / ตรวจรับ

- **TDD** `tracking.test.ts`: `effectiveWeight` (เลือก entry วันที่ล่าสุด, fallback เมื่อว่าง), `dayAdherence` (นับ done/total/pct ถูก รวมกรณีไม่มี workout), `computeStreak` (ต่อเนื่อง/ขาดช่วง/วันนี้ยังไม่ครบ), `dayKeyForDate`, `effectiveProfile` (merge + weight) — ใช้อินพุตคงที่ (todayISO string), ไม่พึ่ง Date/localStorage
- `bun test src/lib` เขียวทั้งหมด (รวมเทสต์เดิม) · `bun run build` ผ่าน
- ตรวจในเบราว์เซอร์: บันทึกน้ำหนัก → เป้าในแท็บอาหารเปลี่ยน + กราฟขึ้นจุด; ติ๊กมื้อ/เล่นเสร็จ/เพิ่มน้ำ (วันนี้) → % อัปเดต; แตะโปรไฟล์เปิดหน้า "ฉัน"; รีเฟรชแล้วข้อมูลคงอยู่ (persist); ไม่มี hydration warning ใน console
- ปิด dev server ค้างไว้ที่ localhost:3000 (จาก Tier 0) ใช้ตรวจได้
