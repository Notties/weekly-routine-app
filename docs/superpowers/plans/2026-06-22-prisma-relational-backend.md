# Prisma Relational Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ย้ายแอปจาก static-export + offline-first Supabase-blob-sync ไปเป็น Next.js server + Prisma relational backend (online-required) บน Vercel โดยไม่ทำข้อมูลผู้ใช้เดิมหาย

**Architecture:** เบราว์เซอร์ (client SPA) เรียก Route Handlers ใต้ `/api/*` ทุก request แนบ Supabase access token; handler verify token → ได้ `userId` → query/mutate ผ่าน Prisma (filter `userId` เสมอ, ความปลอดภัยอยู่ที่โค้ด ไม่ใช่ RLS) บน Supabase Postgres ผ่าน pooler; การอ่าน state ห่อด้วย `use cache` + `cacheTag`, การเขียน `revalidateTag(tag,'max')`

**Tech Stack:** Next.js 16.2.9 (App Router, Route Handlers, Cache Components), React 19, Prisma + `@prisma/client`, Supabase Postgres + Supabase Auth (magic-link), zod, zustand, bun test

## Global Constraints

- **Next.js เวอร์ชันนี้มี breaking changes** — อ่าน guide ใน `node_modules/next/dist/docs/` ก่อนเขียนทุกครั้ง (per `AGENTS.md`); heed deprecation notices
- **Route Handler `context.params` เป็น `Promise`** ใน Next 16 — ต้อง `await params` เสมอ
- **`unstable_cache` ถูก deprecate** — ใช้ directive `use cache` + `cacheTag` (ต้องเปิด `cacheComponents: true`)
- **`revalidateTag` ต้องส่ง 2 อาร์กิวเมนต์**: `revalidateTag(tag, 'max')` (รูปแบบ arg เดียว deprecated)
- **`use cache` scope เข้า `headers()`/`cookies()`/token ไม่ได้** — verify token นอก scope แล้วส่ง `userId` เข้า function เป็น argument
- ทุก write handler ต้อง: `requireUser` → validate (zod) → Prisma filter `userId` → `revalidateTag('state:'+userId,'max')`
- Path alias: `@/*` → `./src/*`
- เทสต์ด้วย `bun test` (`import { describe, it, expect } from "bun:test"`), วางไฟล์เทสต์ข้างไฟล์จริง `*.test.ts`
- เก็บ `date` เป็น string `"YYYY-MM-DD"` (ไม่ใช้ Postgres date/timestamp) — กัน timezone เพี้ยน
- ภาษาในคอมเมนต์/UI: ไทย (ตามโค้ดเดิม)
- Commit บ่อย ทีละ task

## File Structure

**สร้างใหม่:**
- `prisma/schema.prisma` — schema 6 models
- `src/lib/prisma.ts` — Prisma client singleton (กัน hot-reload สร้างซ้ำ)
- `src/lib/api/types.ts` — `SyncSlice` + `StateRows` types (ย้ายจาก `sync.ts` ที่จะลบ)
- `src/lib/api/state-mapper.ts` (+ `.test.ts`) — `rowsToSlice` / `sliceToRows` (pure, จุดเสี่ยงสุด)
- `src/lib/api/http.ts` — `ApiError`, `json()`, `handle()` wrapper
- `src/lib/api/auth.ts` — `requireUser(req)`
- `src/lib/api/state.ts` — `getCachedState(userId)` (`use cache`)
- `src/lib/api/client.ts` (+ `.test.ts`) — fetch wrapper ฝั่ง client (แนบ token + แยกชนิด error)
- `src/lib/api/schemas.ts` — zod schemas ของทุก endpoint
- `src/app/api/state/route.ts` — `GET`
- `src/app/api/profile/route.ts` — `PUT`
- `src/app/api/swaps/[key]/route.ts` — `PUT`, `DELETE`
- `src/app/api/checked/route.ts` — `DELETE` (clear all)
- `src/app/api/checked/[key]/route.ts` — `PUT`, `DELETE`
- `src/app/api/days/[date]/route.ts` — `PUT` (scalar fields)
- `src/app/api/days/[date]/meals/[index]/route.ts` — `PUT`, `DELETE`
- `src/app/api/days/[date]/lifts/[exercise]/route.ts` — `PUT`, `DELETE`
- `src/app/api/migrate/route.ts` — `POST` (seed จาก localStorage เดิม)

**แก้:**
- `next.config.ts` — เอา `output:"export"` ออก, เพิ่ม `cacheComponents:true`
- `package.json` — เพิ่ม deps + scripts `db:generate`/`db:migrate`/`postinstall`
- `.env` / `.env.example` — เพิ่ม `DATABASE_URL`, `DIRECT_URL`
- `src/lib/store.ts` — เอา `persist` ออก, optimistic + rollback, เพิ่ม `hydrate()`
- `src/lib/supabase.ts` — อัปเดตคอมเมนต์ (ยังใช้ทำ auth)
- `src/components/routine-app.tsx` — เปลี่ยน rehydrate→hydrate, เอา `useSyncEngine` ออก, เพิ่ม login/offline gate
- `src/components/sync-card.tsx` — ปรับ label "ซิงค์"→"เข้าสู่ระบบ", เอาปุ่ม "ซิงค์เดี๋ยวนี้" ออก
- `docs/supabase-setup.md` — เขียนใหม่ตามสถาปัตยกรรมใหม่

**ลบ:**
- `src/lib/sync.ts`, `src/lib/sync.test.ts`, `src/lib/use-sync.ts`

---

## Task 1: Foundation — deps, Prisma schema, config, first migration

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json`, `next.config.ts`, `.env`, `.env.example`

**Interfaces:**
- Produces: ตาราง `Profile/Swap/CheckedItem/DayLog/MealCheck/LiftSet` ใน DB; `@prisma/client` generate แล้วใช้ import ได้; env `DATABASE_URL`/`DIRECT_URL`

- [ ] **Step 1: ติดตั้ง dependencies**

```bash
bun add @prisma/client zod
bun add -d prisma
```

- [ ] **Step 2: สร้าง `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Profile {
  userId        String   @id @db.Uuid
  goal          String?
  heightCm      Int?
  age           Int?
  workoutWindow String?
  updatedAt     DateTime @updatedAt
}

model Swap {
  id       String @id @default(cuid())
  userId   String @db.Uuid
  key      String
  recipeId String
  @@unique([userId, key])
  @@index([userId])
}

model CheckedItem {
  id     String @id @default(cuid())
  userId String @db.Uuid
  key    String
  @@unique([userId, key])
  @@index([userId])
}

model DayLog {
  id           String      @id @default(cuid())
  userId       String      @db.Uuid
  date         String
  weightKg     Float?
  workoutDone  Boolean     @default(false)
  waterMl      Int         @default(0)
  extraKcal    Int?
  extraProtein Int?
  meals        MealCheck[]
  lifts        LiftSet[]
  @@unique([userId, date])
  @@index([userId])
}

model MealCheck {
  id        String @id @default(cuid())
  dayLogId  String
  mealIndex Int
  dayLog    DayLog @relation(fields: [dayLogId], references: [id], onDelete: Cascade)
  @@unique([dayLogId, mealIndex])
}

model LiftSet {
  id       String @id @default(cuid())
  dayLogId String
  exercise String
  setIndex Int
  kg       Float
  reps     Int
  dayLog   DayLog @relation(fields: [dayLogId], references: [id], onDelete: Cascade)
  @@unique([dayLogId, exercise, setIndex])
  @@index([exercise])
}
```

- [ ] **Step 3: เพิ่ม env (ค่าจริงจาก Supabase → Settings → Database → Connection string)**

เติมใน `.env` (pooler สำหรับ runtime, direct สำหรับ migrate):

```bash
# Prisma — pooler (port 6543) สำหรับ serverless runtime
DATABASE_URL=postgresql://postgres.ydwjgehmmlcvzgawsyxi:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
# direct (port 5432) สำหรับ prisma migrate เท่านั้น
DIRECT_URL=postgresql://postgres.ydwjgehmmlcvzgawsyxi:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

และเพิ่ม placeholder เดียวกัน (ไม่มีรหัส) ลง `.env.example`:

```bash
DATABASE_URL=postgresql://...pooler...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres
```

- [ ] **Step 4: เพิ่ม scripts ใน `package.json`**

ในบล็อก `"scripts"` เพิ่ม:

```json
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"postinstall": "prisma generate"
```

- [ ] **Step 5: แก้ `next.config.ts` — เลิก static export, เปิด Cache Components**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 6: รัน migration แรก + generate client**

Run: `bunx prisma migrate dev --name init`
Expected: สร้างโฟลเดอร์ `prisma/migrations/<ts>_init/`, ตารางถูกสร้างใน Supabase, ขึ้น `✔ Generated Prisma Client`

- [ ] **Step 7: เปิด RLS deny-all บนทุกตาราง (ปิดช่องโหว่ PostgREST)**

> **ทำไม:** Supabase เปิดตาราง schema `public` ให้ PostgREST เข้าถึงด้วย publishable key (ซึ่ง public) อัตโนมัติ ถ้าไม่เปิด RLS = ใครก็อ่าน/เขียนตารางได้ตรงๆ ข้าม API auth เรา
> เปิด RLS **แบบไม่มี policy** = บล็อก anon/authenticated หมด; ส่วน Prisma ต่อด้วย role `postgres` ที่ bypass RLS อยู่แล้ว จึงทำงานปกติ

สร้าง migration เปล่าแล้วเติม SQL เอง (เพื่อให้ deploy ซ้ำได้):

Run: `bunx prisma migrate dev --create-only --name enable_rls`

แก้ไฟล์ `prisma/migrations/<ts>_enable_rls/migration.sql` ให้มีเนื้อหา:

```sql
alter table "Profile" enable row level security;
alter table "Swap" enable row level security;
alter table "CheckedItem" enable row level security;
alter table "DayLog" enable row level security;
alter table "MealCheck" enable row level security;
alter table "LiftSet" enable row level security;
```

แล้ว apply: `bunx prisma migrate dev`
Expected: ขึ้น `Applying migration ..._enable_rls` สำเร็จ

- [ ] **Step 8: ยืนยันตารางถูกสร้าง + RLS บล็อก anon**

Run: `curl -s -w "\n%{http_code}\n" "https://ydwjgehmmlcvzgawsyxi.supabase.co/rest/v1/Profile?select=userId&limit=1" -H "apikey: sb_publishable_O89uUSO3kEL4Xv5mJSM08g_V9LozHvO" -H "Authorization: Bearer sb_publishable_O89uUSO3kEL4Xv5mJSM08g_V9LozHvO"`
Expected: HTTP `200` กับ body `[]` (ตารางมี + RLS บล็อก = อ่านไม่เห็น row) — ต้องไม่ใช่ 404 PGRST205 และต้องไม่เห็นข้อมูลจริง

> หมายเหตุ: Prisma สร้างตารางชื่อ `Profile` (PascalCase ตาม model) — query ผ่าน PostgREST ใช้ชื่อตรงนั้น

- [ ] **Step 9: Commit**

```bash
git add prisma package.json bun.lock next.config.ts .env.example
git commit -m "feat(backend): add Prisma schema, migration, RLS lockdown, drop static export"
```

> `.env` มักอยู่ใน `.gitignore` แล้ว — อย่า commit ค่าจริง ถ้า `.env` ไม่ถูก ignore ให้เพิ่มเข้าไป

---

## Task 2: Pure state mapper (rowsToSlice / sliceToRows) — TDD

**Files:**
- Create: `src/lib/api/types.ts`, `src/lib/api/state-mapper.ts`, `src/lib/api/state-mapper.test.ts`

**Interfaces:**
- Consumes: `DayLog`, `SetEntry`, `ISODate`, `ProfileOverride` จาก `@/data/types`
- Produces:
  - `type SyncSlice = { swaps: Record<string,string>; checked: Record<string,boolean>; log: Record<ISODate, DayLog>; profileOverride: ProfileOverride }`
  - `type StateRows = { profile: ProfileRow | null; swaps: SwapRow[]; checked: CheckedRow[]; dayLogs: DayLogRow[] }` (รูปแบบ row ดิบจาก Prisma)
  - `type SeedRows = { profile: {...} | null; swaps: {key,recipeId}[]; checked: {key}[]; days: DaySeed[] }`
  - `function rowsToSlice(rows: StateRows): SyncSlice`
  - `function sliceToRows(slice: SyncSlice): SeedRows`

- [ ] **Step 1: เขียน types — `src/lib/api/types.ts`**

```ts
import type { DayLog, ISODate, ProfileOverride, SetEntry } from "@/data/types";

/** ส่วนของ state ที่ persist ขึ้น backend (UI-local เช่น selectedDay ไม่รวม) */
export type SyncSlice = {
  swaps: Record<string, string>;
  checked: Record<string, boolean>;
  log: Record<ISODate, DayLog>;
  profileOverride: ProfileOverride;
};

/** row ดิบจาก Prisma (เฉพาะ field ที่ใช้) */
export type ProfileRow = {
  goal: string | null;
  heightCm: number | null;
  age: number | null;
  workoutWindow: string | null;
};
export type SwapRow = { key: string; recipeId: string };
export type CheckedRow = { key: string };
export type MealCheckRow = { mealIndex: number };
export type LiftSetRow = { exercise: string; setIndex: number; kg: number; reps: number };
export type DayLogRow = {
  date: string;
  weightKg: number | null;
  workoutDone: boolean;
  waterMl: number;
  extraKcal: number | null;
  extraProtein: number | null;
  meals: MealCheckRow[];
  lifts: LiftSetRow[];
};
export type StateRows = {
  profile: ProfileRow | null;
  swaps: SwapRow[];
  checked: CheckedRow[];
  dayLogs: DayLogRow[];
};

/** รูปแบบ normalized สำหรับ seed ลง DB (migrate) */
export type DaySeed = {
  date: string;
  weightKg: number | null;
  workoutDone: boolean;
  waterMl: number;
  extraKcal: number | null;
  extraProtein: number | null;
  meals: number[];
  lifts: { exercise: string; sets: SetEntry[] }[];
};
export type SeedRows = {
  profile: ProfileRow | null;
  swaps: SwapRow[];
  checked: CheckedRow[];
  days: DaySeed[];
};
```

- [ ] **Step 2: เขียนเทสต์ที่ fail — `src/lib/api/state-mapper.test.ts`**

```ts
import { describe, it, expect } from "bun:test";
import type { StateRows, SyncSlice } from "./types";
import { rowsToSlice, sliceToRows } from "./state-mapper";

describe("rowsToSlice", () => {
  it("ประกอบ slice จาก rows ครบทุกส่วน", () => {
    const rows: StateRows = {
      profile: { goal: "ลด", heightCm: 170, age: 30, workoutWindow: "19:00–20:00" },
      swaps: [{ key: "mon:0", recipeId: "r1" }],
      checked: [{ key: "ไข่" }],
      dayLogs: [
        {
          date: "2026-06-01",
          weightKg: 75,
          workoutDone: true,
          waterMl: 1500,
          extraKcal: 200,
          extraProtein: 10,
          meals: [{ mealIndex: 0 }, { mealIndex: 2 }],
          lifts: [
            { exercise: "Squat", setIndex: 0, kg: 60, reps: 8 },
            { exercise: "Squat", setIndex: 1, kg: 62.5, reps: 6 },
          ],
        },
      ],
    };
    const slice = rowsToSlice(rows);
    expect(slice.profileOverride).toEqual({
      goal: "ลด", heightCm: 170, age: 30, workoutWindow: "19:00–20:00",
    });
    expect(slice.swaps).toEqual({ "mon:0": "r1" });
    expect(slice.checked).toEqual({ ไข่: true });
    const day = slice.log["2026-06-01"];
    expect(day.weightKg).toBe(75);
    expect(day.workoutDone).toBe(true);
    expect(day.waterMl).toBe(1500);
    expect(day.extra).toEqual({ kcal: 200, protein: 10 });
    expect(day.meals).toEqual({ 0: true, 2: true });
    expect(day.lifts).toEqual({ Squat: [{ kg: 60, reps: 8 }, { kg: 62.5, reps: 6 }] });
  });

  it("profile null + field ว่าง → ละ field ที่เป็น null", () => {
    const slice = rowsToSlice({ profile: null, swaps: [], checked: [], dayLogs: [] });
    expect(slice.profileOverride).toEqual({});
    expect(slice.log).toEqual({});
  });

  it("เรียง lifts ตาม setIndex แม้ row สลับลำดับ", () => {
    const slice = rowsToSlice({
      profile: null, swaps: [], checked: [],
      dayLogs: [{
        date: "2026-06-02", weightKg: null, workoutDone: false, waterMl: 0,
        extraKcal: null, extraProtein: null, meals: [],
        lifts: [
          { exercise: "Bench", setIndex: 1, kg: 50, reps: 6 },
          { exercise: "Bench", setIndex: 0, kg: 50, reps: 8 },
        ],
      }],
    });
    expect(slice.log["2026-06-02"].lifts).toEqual({
      Bench: [{ kg: 50, reps: 8 }, { kg: 50, reps: 6 }],
    });
  });
});

describe("sliceToRows ↔ rowsToSlice round-trip", () => {
  it("slice → rows → slice ได้ค่าเดิม", () => {
    const slice: SyncSlice = {
      swaps: { "mon:0": "r1", "tue:1": "r2" },
      checked: { ไข่: true, นม: true },
      profileOverride: { goal: "เพิ่ม", age: 28 },
      log: {
        "2026-06-01": {
          weightKg: 80, workoutDone: true, waterMl: 2000,
          extra: { kcal: 300, protein: 20 },
          meals: { 1: true },
          lifts: { Deadlift: [{ kg: 100, reps: 5 }] },
        },
      },
    };
    const seed = sliceToRows(slice);
    // จำลองการอ่านกลับเป็น StateRows (เหมือนที่ Prisma จะคืน)
    const rows: StateRows = {
      profile: { goal: "เพิ่ม", heightCm: null, age: 28, workoutWindow: null },
      swaps: seed.swaps,
      checked: seed.checked,
      dayLogs: seed.days.map((d) => ({
        date: d.date, weightKg: d.weightKg, workoutDone: d.workoutDone,
        waterMl: d.waterMl, extraKcal: d.extraKcal, extraProtein: d.extraProtein,
        meals: d.meals.map((mealIndex) => ({ mealIndex })),
        lifts: d.lifts.flatMap((l) =>
          l.sets.map((s, setIndex) => ({ exercise: l.exercise, setIndex, kg: s.kg, reps: s.reps }))
        ),
      })),
    };
    expect(rowsToSlice(rows)).toEqual(slice);
  });
});
```

- [ ] **Step 3: รันเทสต์ ให้ fail**

Run: `bun test src/lib/api/state-mapper.test.ts`
Expected: FAIL — `rowsToSlice is not a function` / module not found

- [ ] **Step 4: เขียน implementation — `src/lib/api/state-mapper.ts`**

```ts
import type { DayLog } from "@/data/types";
import type {
  DaySeed, SeedRows, StateRows, SyncSlice,
} from "./types";

/** ตัด field ที่เป็น null/undefined ออกจาก object (ให้ profileOverride สะอาด) */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) out[k as keyof T] = v as T[keyof T];
  }
  return out;
}

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

  const profileOverride = rows.profile
    ? compact({
        goal: rows.profile.goal,
        heightCm: rows.profile.heightCm,
        age: rows.profile.age,
        workoutWindow: rows.profile.workoutWindow,
      })
    : {};

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
```

- [ ] **Step 5: รันเทสต์ ให้ผ่าน**

Run: `bun test src/lib/api/state-mapper.test.ts`
Expected: PASS ทุกเคส

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/state-mapper.ts src/lib/api/state-mapper.test.ts
git commit -m "feat(backend): pure state-mapper rows<->slice with round-trip tests"
```

---

## Task 3: Server infra — Prisma singleton, http helpers, requireUser

**Files:**
- Create: `src/lib/prisma.ts`, `src/lib/api/http.ts`, `src/lib/api/auth.ts`, `src/lib/api/auth.test.ts`

**Interfaces:**
- Consumes: `getSupabase`-style client creation จาก `@supabase/supabase-js`; env เดิม `NEXT_PUBLIC_SUPABASE_URL` + publishable key
- Produces:
  - `prisma: PrismaClient` (singleton, import จาก `@/lib/prisma`)
  - `class ApiError extends Error { status: number }`
  - `function json(data: unknown, status?: number): Response`
  - `function handle(fn: () => Promise<Response>): Promise<Response>` — จับ `ApiError`→status, `ZodError`→400, อื่น→500
  - `function requireUser(req: Request): Promise<string>` — คืน `userId`, ไม่ผ่าน throw `ApiError(401)`

- [ ] **Step 1: Prisma singleton — `src/lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

// กัน hot-reload ตอน dev สร้าง client ซ้ำจน connection หมด
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: http helpers — `src/lib/api/http.ts`**

```ts
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data as object, { status });
}

/** ครอบ handler: แปลง error เป็น Response มาตรฐาน */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    if (e instanceof ZodError) return json({ error: "invalid body", issues: e.issues }, 400);
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
}
```

- [ ] **Step 3: เขียนเทสต์ requireUser ที่ fail — `src/lib/api/auth.test.ts`**

```ts
import { describe, it, expect, mock, beforeEach } from "bun:test";

// mock supabase client ก่อน import auth
const getUser = mock(async (_token: string) => ({ data: { user: null }, error: null }));
mock.module("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser } }),
}));

const { requireUser } = await import("./auth");
const { ApiError } = await import("./http");

function req(headers: Record<string, string> = {}) {
  return new Request("http://x/api", { headers });
}

beforeEach(() => {
  getUser.mockReset();
});

describe("requireUser", () => {
  it("ไม่มี Authorization header → ApiError 401", async () => {
    expect(requireUser(req())).rejects.toBeInstanceOf(ApiError);
  });

  it("token ใช้ไม่ได้ → ApiError 401", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "bad" } });
    expect(requireUser(req({ Authorization: "Bearer xxx" }))).rejects.toBeInstanceOf(ApiError);
  });

  it("token ใช้ได้ → คืน userId", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u-123" } }, error: null });
    const id = await requireUser(req({ Authorization: "Bearer good" }));
    expect(id).toBe("u-123");
  });
});
```

- [ ] **Step 4: รันเทสต์ ให้ fail**

Run: `bun test src/lib/api/auth.test.ts`
Expected: FAIL — module `./auth` not found

- [ ] **Step 5: เขียน `src/lib/api/auth.ts`**

```ts
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "./http";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** verify Supabase access token จาก Authorization header → คืน userId */
export async function requireUser(req: Request): Promise<string> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  if (!token) throw new ApiError(401, "unauthorized");
  if (!url || !anonKey) throw new ApiError(500, "supabase not configured");

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "unauthorized");
  return data.user.id;
}
```

- [ ] **Step 6: รันเทสต์ ให้ผ่าน**

Run: `bun test src/lib/api/auth.test.ts`
Expected: PASS ทุกเคส

- [ ] **Step 7: Commit**

```bash
git add src/lib/prisma.ts src/lib/api/http.ts src/lib/api/auth.ts src/lib/api/auth.test.ts
git commit -m "feat(backend): prisma singleton, http helpers, requireUser auth"
```

---

## Task 4: zod schemas + GET /api/state (cached read)

**Files:**
- Create: `src/lib/api/schemas.ts`, `src/lib/api/state.ts`, `src/app/api/state/route.ts`

**Interfaces:**
- Consumes: `prisma`, `requireUser`, `handle`, `json`, `rowsToSlice`, `StateRows`
- Produces:
  - schemas: `ProfileSchema`, `DayScalarSchema`, `LiftSetsSchema`, `SwapSchema`
  - `function getCachedState(userId: string): Promise<SyncSlice>` (`use cache`)
  - `GET /api/state` → 200 `SyncSlice`

- [ ] **Step 1: zod schemas — `src/lib/api/schemas.ts`**

```ts
import { z } from "zod";

export const ProfileSchema = z.object({
  goal: z.string().nullable().optional(),
  heightCm: z.number().int().nullable().optional(),
  age: z.number().int().nullable().optional(),
  workoutWindow: z.string().nullable().optional(),
});
export type ProfileInput = z.infer<typeof ProfileSchema>;

export const DayScalarSchema = z.object({
  weightKg: z.number().nullable().optional(),
  workoutDone: z.boolean().optional(),
  waterMl: z.number().int().min(0).optional(),
  extraKcal: z.number().int().nullable().optional(),
  extraProtein: z.number().int().nullable().optional(),
});
export type DayScalarInput = z.infer<typeof DayScalarSchema>;

export const LiftSetsSchema = z.object({
  sets: z.array(z.object({ kg: z.number(), reps: z.number().int() })),
});
export type LiftSetsInput = z.infer<typeof LiftSetsSchema>;

export const SwapSchema = z.object({ recipeId: z.string().min(1) });
```

- [ ] **Step 2: cached state reader — `src/lib/api/state.ts`**

```ts
import { cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rowsToSlice } from "./state-mapper";
import type { StateRows, SyncSlice } from "./types";

/**
 * อ่าน state ทั้งก้อนของผู้ใช้ — ห่อ use cache + tag ต่อ user
 * NOTE: ห้ามอ่าน headers/token ที่นี่ (use cache เข้าไม่ได้) — รับ userId เป็น arg
 */
export async function getCachedState(userId: string): Promise<SyncSlice> {
  "use cache";
  cacheTag(`state:${userId}`);

  const [profile, swaps, checked, dayLogs] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.swap.findMany({ where: { userId } }),
    prisma.checkedItem.findMany({ where: { userId } }),
    prisma.dayLog.findMany({
      where: { userId },
      include: { meals: true, lifts: true },
    }),
  ]);

  return rowsToSlice({ profile, swaps, checked, dayLogs } as StateRows);
}
```

- [ ] **Step 3: route — `src/app/api/state/route.ts`**

```ts
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { getCachedState } from "@/lib/api/state";

export async function GET(req: Request) {
  return handle(async () => {
    const userId = await requireUser(req); // verify นอก use cache
    const slice = await getCachedState(userId);
    return json(slice);
  });
}
```

- [ ] **Step 4: ยืนยัน type-check + dev server ตอบ 401 เมื่อไม่มี token**

Run: `bunx tsc --noEmit`
Expected: ไม่มี error

Run (อีก terminal): `bun run dev` แล้ว `curl -s -w "\n%{http_code}\n" http://localhost:3000/api/state`
Expected: `{"error":"unauthorized"}` + `401`

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/schemas.ts src/lib/api/state.ts src/app/api/state/route.ts
git commit -m "feat(api): GET /api/state with use-cache per-user read"
```

---

## Task 5: Write routes — profile, swaps, checked

**Files:**
- Create: `src/app/api/profile/route.ts`, `src/app/api/swaps/[key]/route.ts`, `src/app/api/checked/route.ts`, `src/app/api/checked/[key]/route.ts`
- Create: `src/app/api/profile/route.test.ts`

**Interfaces:**
- Consumes: `prisma`, `requireUser`, `handle`, `json`, `ApiError`, schemas, `revalidateTag`
- Produces: endpoints ทั้งหมดคืน 200/204; ทุก write เรียก `revalidateTag('state:'+userId,'max')`

- [ ] **Step 1: PUT /api/profile — `src/app/api/profile/route.ts`**

```ts
import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { ProfileSchema } from "@/lib/api/schemas";

export async function PUT(req: Request) {
  return handle(async () => {
    const userId = await requireUser(req);
    const data = ProfileSchema.parse(await req.json());
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}
```

- [ ] **Step 2: PUT/DELETE /api/swaps/[key] — `src/app/api/swaps/[key]/route.ts`**

```ts
import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { SwapSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ key: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { key } = await params;
    const { recipeId } = SwapSchema.parse(await req.json());
    await prisma.swap.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, recipeId },
      update: { recipeId },
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { key } = await params;
    await prisma.swap.deleteMany({ where: { userId, key } });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
```

- [ ] **Step 3: PUT/DELETE /api/checked/[key] — `src/app/api/checked/[key]/route.ts`**

```ts
import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ key: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { key } = await params;
    await prisma.checkedItem.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key },
      update: {},
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { key } = await params;
    await prisma.checkedItem.deleteMany({ where: { userId, key } });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
```

- [ ] **Step 4: DELETE /api/checked (clear all) — `src/app/api/checked/route.ts`**

```ts
import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  return handle(async () => {
    const userId = await requireUser(req);
    await prisma.checkedItem.deleteMany({ where: { userId } });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
```

- [ ] **Step 5: เทสต์ handler ด้วย mock (ownership + validation) — `src/app/api/profile/route.test.ts`**

```ts
import { describe, it, expect, mock, beforeEach } from "bun:test";

const upsert = mock(async (_args: unknown) => ({}));
const revalidateTag = mock((_t: string, _p: string) => {});
mock.module("@/lib/prisma", () => ({ prisma: { profile: { upsert } } }));
mock.module("next/cache", () => ({ revalidateTag }));
mock.module("@/lib/api/auth", () => ({ requireUser: async () => "u-1" }));

const { PUT } = await import("./route");

function put(body: unknown) {
  return new Request("http://x/api/profile", {
    method: "PUT",
    headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  upsert.mockClear();
  revalidateTag.mockClear();
});

describe("PUT /api/profile", () => {
  it("body ถูกต้อง → upsert filter userId + revalidate", async () => {
    const res = await PUT(put({ goal: "ลด", age: 30 }));
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
    const arg = upsert.mock.calls[0][0] as { where: { userId: string } };
    expect(arg.where.userId).toBe("u-1");
    expect(revalidateTag).toHaveBeenCalledWith("state:u-1", "max");
  });

  it("body ผิด type → 400", async () => {
    const res = await PUT(put({ age: "ไม่ใช่ตัวเลข" }));
    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: รันเทสต์ ให้ผ่าน + type-check**

Run: `bun test src/app/api/profile/route.test.ts && bunx tsc --noEmit`
Expected: PASS + ไม่มี type error

- [ ] **Step 7: Commit**

```bash
git add src/app/api/profile src/app/api/swaps src/app/api/checked
git commit -m "feat(api): write routes for profile, swaps, checked"
```

---

## Task 6: Write routes — day scalar, meals, lifts

**Files:**
- Create: `src/app/api/days/[date]/route.ts`, `src/app/api/days/[date]/meals/[index]/route.ts`, `src/app/api/days/[date]/lifts/[exercise]/route.ts`
- Create: `src/lib/api/day.ts` (helper `ensureDayLog`)

**Interfaces:**
- Consumes: `prisma`, `requireUser`, `handle`, schemas, `revalidateTag`
- Produces:
  - `function ensureDayLog(userId: string, date: string): Promise<{ id: string }>` — upsert วันแล้วคืน id
  - endpoints day scalar / meals toggle / lifts replace

- [ ] **Step 1: helper — `src/lib/api/day.ts`**

```ts
import { prisma } from "@/lib/prisma";

/** upsert DayLog ของ (userId,date) แล้วคืน row id — ใช้ก่อนแตะ meals/lifts */
export async function ensureDayLog(userId: string, date: string): Promise<{ id: string }> {
  return prisma.dayLog.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
    select: { id: true },
  });
}
```

- [ ] **Step 2: PUT /api/days/[date] (scalar) — `src/app/api/days/[date]/route.ts`**

```ts
import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { DayScalarSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ date: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date } = await params;
    const data = DayScalarSchema.parse(await req.json());
    await prisma.dayLog.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...data },
      update: data,
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}
```

- [ ] **Step 3: PUT/DELETE meals toggle — `src/app/api/days/[date]/meals/[index]/route.ts`**

```ts
import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json, ApiError } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { ensureDayLog } from "@/lib/api/day";

type Ctx = { params: Promise<{ date: string; index: string }> };

function parseIndex(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) throw new ApiError(400, "invalid meal index");
  return n;
}

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date, index } = await params;
    const mealIndex = parseIndex(index);
    const day = await ensureDayLog(userId, date);
    await prisma.mealCheck.upsert({
      where: { dayLogId_mealIndex: { dayLogId: day.id, mealIndex } },
      create: { dayLogId: day.id, mealIndex },
      update: {},
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date, index } = await params;
    const mealIndex = parseIndex(index);
    // ลบเฉพาะถ้า dayLog เป็นของ user นี้ (กันแตะข้ามผู้ใช้)
    await prisma.mealCheck.deleteMany({
      where: { mealIndex, dayLog: { userId, date } },
    });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
```

- [ ] **Step 4: PUT/DELETE lifts (replace array ของท่า) — `src/app/api/days/[date]/lifts/[exercise]/route.ts`**

```ts
import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { ensureDayLog } from "@/lib/api/day";
import { LiftSetsSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ date: string; exercise: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date, exercise: rawExercise } = await params;
    const exercise = decodeURIComponent(rawExercise);
    const { sets } = LiftSetsSchema.parse(await req.json());
    const day = await ensureDayLog(userId, date);
    // replace ทั้งท่า: ลบเก่า → ใส่ใหม่ ใน transaction
    await prisma.$transaction([
      prisma.liftSet.deleteMany({ where: { dayLogId: day.id, exercise } }),
      prisma.liftSet.createMany({
        data: sets.map((s, setIndex) => ({
          dayLogId: day.id, exercise, setIndex, kg: s.kg, reps: s.reps,
        })),
      }),
    ]);
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date, exercise: rawExercise } = await params;
    const exercise = decodeURIComponent(rawExercise);
    await prisma.liftSet.deleteMany({
      where: { exercise, dayLog: { userId, date } },
    });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
```

- [ ] **Step 5: type-check + dev smoke (401 ก่อน auth)**

Run: `bunx tsc --noEmit`
Expected: ไม่มี error

Run: `curl -s -w "\n%{http_code}\n" -X PUT http://localhost:3000/api/days/2026-06-01 -H "Content-Type: application/json" -d '{"weightKg":75}'`
Expected: `{"error":"unauthorized"}` + `401`

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/day.ts src/app/api/days
git commit -m "feat(api): write routes for day scalar, meals, lifts"
```

---

## Task 7: POST /api/migrate — seed จาก localStorage เดิม

**Files:**
- Create: `src/app/api/migrate/route.ts`
- Create: `src/lib/api/migrate.test.ts` (เทสต์ของ schema validation ของ payload)

**Interfaces:**
- Consumes: `requireUser`, `handle`, `prisma`, `sliceToRows`, `revalidateTag`
- Produces:
  - `MigrateSchema` (zod ของ `SyncSlice`)
  - `POST /api/migrate` → upsert idempotent ทุกตารางจาก `SyncSlice`

- [ ] **Step 1: เพิ่ม `MigrateSchema` ใน `src/lib/api/schemas.ts`**

ต่อท้ายไฟล์:

```ts
const SetSchema = z.object({ kg: z.number(), reps: z.number().int() });
const DayLogSchema = z.object({
  weightKg: z.number().optional(),
  meals: z.record(z.string(), z.literal(true)).optional(),
  workoutDone: z.boolean().optional(),
  waterMl: z.number().optional(),
  extra: z.object({ kcal: z.number(), protein: z.number() }).optional(),
  lifts: z.record(z.string(), z.array(SetSchema)).optional(),
});
export const MigrateSchema = z.object({
  swaps: z.record(z.string(), z.string()),
  checked: z.record(z.string(), z.boolean()),
  log: z.record(z.string(), DayLogSchema),
  profileOverride: ProfileSchema,
});
```

- [ ] **Step 2: route — `src/app/api/migrate/route.ts`**

```ts
import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { MigrateSchema } from "@/lib/api/schemas";
import { sliceToRows } from "@/lib/api/state-mapper";
import type { SyncSlice } from "@/lib/api/types";

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await requireUser(req);
    const slice = MigrateSchema.parse(await req.json()) as SyncSlice;
    const rows = sliceToRows(slice);

    // idempotent: upsert ทุกอย่าง — เรียกซ้ำได้ไม่พัง
    if (rows.profile) {
      await prisma.profile.upsert({
        where: { userId },
        create: { userId, ...rows.profile },
        update: rows.profile,
      });
    }
    for (const s of rows.swaps) {
      await prisma.swap.upsert({
        where: { userId_key: { userId, key: s.key } },
        create: { userId, key: s.key, recipeId: s.recipeId },
        update: { recipeId: s.recipeId },
      });
    }
    for (const c of rows.checked) {
      await prisma.checkedItem.upsert({
        where: { userId_key: { userId, key: c.key } },
        create: { userId, key: c.key },
        update: {},
      });
    }
    for (const d of rows.days) {
      const day = await prisma.dayLog.upsert({
        where: { userId_date: { userId, date: d.date } },
        create: {
          userId, date: d.date, weightKg: d.weightKg,
          workoutDone: d.workoutDone, waterMl: d.waterMl,
          extraKcal: d.extraKcal, extraProtein: d.extraProtein,
        },
        update: {
          weightKg: d.weightKg, workoutDone: d.workoutDone, waterMl: d.waterMl,
          extraKcal: d.extraKcal, extraProtein: d.extraProtein,
        },
        select: { id: true },
      });
      for (const mealIndex of d.meals) {
        await prisma.mealCheck.upsert({
          where: { dayLogId_mealIndex: { dayLogId: day.id, mealIndex } },
          create: { dayLogId: day.id, mealIndex },
          update: {},
        });
      }
      for (const l of d.lifts) {
        await prisma.$transaction([
          prisma.liftSet.deleteMany({ where: { dayLogId: day.id, exercise: l.exercise } }),
          prisma.liftSet.createMany({
            data: l.sets.map((s, setIndex) => ({
              dayLogId: day.id, exercise: l.exercise, setIndex, kg: s.kg, reps: s.reps,
            })),
          }),
        ]);
      }
    }

    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}
```

- [ ] **Step 3: เทสต์ schema ของ payload — `src/lib/api/migrate.test.ts`**

```ts
import { describe, it, expect } from "bun:test";
import { MigrateSchema } from "./schemas";

describe("MigrateSchema", () => {
  it("รับ SyncSlice ที่ถูกต้อง", () => {
    const ok = MigrateSchema.safeParse({
      swaps: { "mon:0": "r1" },
      checked: { ไข่: true },
      profileOverride: { goal: "ลด", age: 30 },
      log: { "2026-06-01": { weightKg: 75, meals: { 0: true }, lifts: { Squat: [{ kg: 60, reps: 8 }] } } },
    });
    expect(ok.success).toBe(true);
  });

  it("ปฏิเสธ lifts ที่ reps ไม่ใช่ int", () => {
    const bad = MigrateSchema.safeParse({
      swaps: {}, checked: {}, profileOverride: {},
      log: { "2026-06-01": { lifts: { Squat: [{ kg: 60, reps: 8.5 }] } } },
    });
    expect(bad.success).toBe(false);
  });
});
```

- [ ] **Step 4: รันเทสต์ + type-check**

Run: `bun test src/lib/api/migrate.test.ts && bunx tsc --noEmit`
Expected: PASS + ไม่มี type error

- [ ] **Step 5: Commit**

```bash
git add src/app/api/migrate src/lib/api/schemas.ts src/lib/api/migrate.test.ts
git commit -m "feat(api): POST /api/migrate to seed from legacy localStorage"
```

---

## Task 8: Client API wrapper (token + error classification) — TDD

**Files:**
- Create: `src/lib/api/client.ts`, `src/lib/api/client.test.ts`

**Interfaces:**
- Consumes: `getSupabase` จาก `@/lib/supabase`
- Produces:
  - `class NetworkError extends Error` / `class AuthError extends Error`
  - `function apiGet<T>(path: string): Promise<T>`
  - `function apiSend(method: "PUT" | "POST" | "DELETE", path: string, body?: unknown): Promise<void>`
  - ทั้งคู่แนบ `Authorization: Bearer <access_token>` อัตโนมัติ; 401→`AuthError`, fetch reject→`NetworkError`, 5xx→`Error`

- [ ] **Step 1: เขียนเทสต์ที่ fail — `src/lib/api/client.test.ts`**

```ts
import { describe, it, expect, mock, beforeEach } from "bun:test";

const getSession = mock(async () => ({ data: { session: { access_token: "tok" } } }));
mock.module("@/lib/supabase", () => ({
  getSupabase: () => ({ auth: { getSession } }),
}));

const { apiGet, apiSend, AuthError, NetworkError } = await import("./client");

const realFetch = globalThis.fetch;
beforeEach(() => {
  getSession.mockClear();
  globalThis.fetch = realFetch;
});

describe("apiGet", () => {
  it("แนบ bearer token + คืน json", async () => {
    let seenAuth = "";
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      seenAuth = new Headers(init.headers).get("authorization") ?? "";
      return new Response(JSON.stringify({ ok: 1 }), { status: 200 });
    }) as typeof fetch;
    const data = await apiGet<{ ok: number }>("/api/state");
    expect(seenAuth).toBe("Bearer tok");
    expect(data.ok).toBe(1);
  });

  it("401 → AuthError", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 401 })) as typeof fetch;
    expect(apiGet("/api/state")).rejects.toBeInstanceOf(AuthError);
  });

  it("fetch reject → NetworkError", async () => {
    globalThis.fetch = (async () => { throw new Error("offline"); }) as typeof fetch;
    expect(apiGet("/api/state")).rejects.toBeInstanceOf(NetworkError);
  });
});

describe("apiSend", () => {
  it("ส่ง body JSON + method", async () => {
    let seen: { method?: string; body?: string } = {};
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      seen = { method: init.method, body: init.body as string };
      return new Response(null, { status: 204 });
    }) as typeof fetch;
    await apiSend("PUT", "/api/profile", { goal: "ลด" });
    expect(seen.method).toBe("PUT");
    expect(JSON.parse(seen.body!)).toEqual({ goal: "ลด" });
  });
});
```

- [ ] **Step 2: รันเทสต์ ให้ fail**

Run: `bun test src/lib/api/client.test.ts`
Expected: FAIL — module `./client` not found

- [ ] **Step 3: เขียน `src/lib/api/client.ts`**

```ts
import { getSupabase } from "@/lib/supabase";

export class AuthError extends Error {}
export class NetworkError extends Error {}

async function authHeader(): Promise<Record<string, string>> {
  const sb = getSupabase();
  if (!sb) return {};
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function run(path: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new NetworkError("เครือข่ายขัดข้อง");
  }
  if (res.status === 401) throw new AuthError("ต้องเข้าสู่ระบบ");
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await run(path, { headers: { ...(await authHeader()) } });
  return (await res.json()) as T;
}

export async function apiSend(
  method: "PUT" | "POST" | "DELETE",
  path: string,
  body?: unknown
): Promise<void> {
  await run(path, {
    method,
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
```

- [ ] **Step 4: รันเทสต์ ให้ผ่าน**

Run: `bun test src/lib/api/client.test.ts`
Expected: PASS ทุกเคส

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/client.ts src/lib/api/client.test.ts
git commit -m "feat(client): api fetch wrapper with token + error classification"
```

---

## Task 9: Rewrite store (online+optimistic) + remove sync engine + rewire app

> รวม Task 9+10 เดิมเป็น task เดียว เพื่อให้ commit นี้ build เขียว (เขียน store ใหม่ทำให้ `use-sync.ts` พังจนกว่าจะลบ จึงต้องทำพร้อมกัน)

**Files:**
- Modify: `src/lib/store.ts`, `src/components/routine-app.tsx`, `src/lib/supabase.ts`
- Delete: `src/lib/sync.ts`, `src/lib/sync.test.ts`, `src/lib/use-sync.ts`

**Interfaces:**
- Consumes: `apiSend`, `apiGet` จาก `@/lib/api/client`; `SyncSlice` จาก `@/lib/api/types`
- Produces: `useAppStore.hydrate()`; app root เรียก `hydrate()` ตอน mount; ไม่มีการอ้าง `useSyncEngine`/`sync.ts`/`applyRemoteState` เหลือ
- Produces:
  - store ไม่มี `persist` แล้ว
  - `hydrate(): Promise<void>` — `apiGet('/api/state')` → set ลง store
  - ทุก mutate action เป็น optimistic: set ทันที → `apiSend(...)` → error rollback + ตั้ง `syncError`
  - field ใหม่: `online: boolean`, `syncError: string | null`
  - คง action signatures เดิมทุกตัว (component ไม่ต้องแก้ signature)

- [ ] **Step 1: เขียน store ใหม่ทั้งไฟล์ — `src/lib/store.ts`**

```ts
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
```

- [ ] **Step 2: ลบไฟล์ sync engine**

```bash
git rm src/lib/sync.ts src/lib/sync.test.ts src/lib/use-sync.ts
```

- [ ] **Step 3: แก้ `src/lib/supabase.ts` — อัปเดตคอมเมนต์ + ลบ STATE_TABLE**

แทนบล็อกคอมเมนต์หัวไฟล์ด้วย:

```ts
// ───────────────────────────────────────────────────────────
// Supabase client — ใช้สำหรับ "auth" (magic-link) ฝั่ง client เท่านั้น
// ข้อมูลแอปไปผ่าน /api/* (Prisma) ไม่ผ่าน client นี้แล้ว
// ไม่ตั้ง env = ปุ่มเข้าสู่ระบบจะถูกซ่อน (ดู isSyncConfigured)
// ───────────────────────────────────────────────────────────
```

และลบบรรทัด `export const STATE_TABLE = "user_state";` (ไม่ใช้แล้ว)

- [ ] **Step 4: แก้ `src/components/routine-app.tsx` — เปลี่ยน sync→hydrate**

ลบ import `import { useSyncEngine } from "@/lib/use-sync";`

ลบบรรทัด:
```ts
  // cloud sync (no-op ถ้าไม่ได้ตั้ง env / ไม่ล็อกอิน)
  useSyncEngine();
```

แทน effect ตอน mount (เดิมเรียก `useAppStore.persist.rehydrate()`):

```ts
  // mount: โหลด state จาก backend + รู้ "วันนี้"
  React.useEffect(() => {
    void useAppStore.getState().hydrate();
    setToday(DAY_ORDER[new Date().getDay()]);
  }, []);
```

- [ ] **Step 5: type-check + lint + เทสต์ทั้งหมด (ต้องเขียวก่อน commit)**

Run: `bunx tsc --noEmit && bun run lint && bun test src/lib`
Expected: ไม่มี type error, lint ผ่าน, เทสต์ผ่านทั้งหมด (ไม่มี `sync.test.ts` แล้ว ไม่มีการอ้าง `applyRemoteState`)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(store): online optimistic store, remove sync engine, hydrate from /api/state"
```

---

## Task 10: ~~Remove sync engine + wire app~~ — MERGED INTO TASK 9

> รวมเข้า Task 9 แล้ว (เพื่อให้ commit build เขียว) — **ไม่ต้อง dispatch task นี้** ข้ามไป Task 11

---

## Task 11: Login/offline gating + sync-card → login + one-time migration

**Files:**
- Modify: `src/components/routine-app.tsx`, `src/components/sync-card.tsx`
- Create: `src/lib/api/run-migration.ts`

**Interfaces:**
- Consumes: `useAppStore` (`syncError`, `online`), `getSupabase`, `apiSend`
- Produces:
  - banner ออฟไลน์/error ใน app root
  - `runMigrationOnce(): Promise<void>` — ย้าย localStorage เดิมขึ้น `/api/migrate` ครั้งเดียว
  - `sync-card` เปลี่ยนข้อความเป็น "เข้าสู่ระบบ", เอาปุ่ม "ซิงค์เดี๋ยวนี้" ออก

- [ ] **Step 1: one-time migration — `src/lib/api/run-migration.ts`**

```ts
import { apiSend } from "@/lib/api/client";

const LEGACY_KEY = "knot-gym";
const MIGRATED_FLAG = "knot-gym-migrated";

/**
 * ย้ายข้อมูล localStorage เดิม (zustand persist) ขึ้น backend ครั้งเดียว
 * เรียกหลัง login สำเร็จ — idempotent ด้วย flag
 */
export async function runMigrationOnce(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_FLAG)) return;
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_FLAG, "1");
    return;
  }
  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    const s = parsed.state ?? {};
    const slice = {
      swaps: s.swaps ?? {},
      checked: s.checked ?? {},
      log: s.log ?? {},
      profileOverride: s.profileOverride ?? {},
    };
    await apiSend("POST", "/api/migrate", slice);
    localStorage.setItem(MIGRATED_FLAG, "1");
  } catch {
    // ปล่อยให้ flag ยังไม่ตั้ง → ลองใหม่ครั้งหน้า
  }
}
```

- [ ] **Step 2: เรียก migration หลัง login ใน `sync-card.tsx`**

ใน `src/components/sync-card.tsx`:
- เปลี่ยน import `signIn, signOut, syncNow` ให้มาจากที่ใหม่ — **แต่ `use-sync.ts` ถูกลบแล้ว** ดังนั้นย้าย `signIn`/`signOut`/auth-state ลง component นี้โดยตรง

แทนทั้งไฟล์ `src/components/sync-card.tsx` ด้วย:

```tsx
"use client";

import * as React from "react";
import { Cloud, CloudOff, LogOut, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { runMigrationOnce } from "@/lib/api/run-migration";

export function SyncCard() {
  const [email, setEmail] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const syncError = useAppStore((s) => s.syncError);

  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        void runMigrationOnce().then(() => useAppStore.getState().hydrate());
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSyncConfigured) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <CloudOff className="size-4" />
          เข้าสู่ระบบ
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          ยังไม่ได้ตั้งค่าคลาวด์ — แอปนี้ต้องตั้งค่า Supabase จึงจะใช้งานได้
        </p>
      </section>
    );
  }

  const send = async () => {
    const e = input.trim();
    if (!e) return;
    setBusy(true);
    setError(null);
    const sb = getSupabase()!;
    const { error: err } = await sb.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  const signOut = async () => {
    await getSupabase()?.auth.signOut();
    setEmail(null);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Cloud className="size-4" />
        เข้าสู่ระบบ
      </h3>

      {email ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            เข้าระบบเป็น <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-foreground">
              <Check className="size-3" />
              {syncError ? syncError : "ข้อมูลซิงค์อัตโนมัติ"}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => void signOut()}>
              <LogOut className="size-3.5" />
              ออกจากระบบ
            </Button>
          </div>
        </>
      ) : sent ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-primary/10 px-2 py-2 text-xs leading-snug">
          <Mail className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>ส่งลิงก์เข้าระบบไปที่อีเมลแล้ว — เปิดลิงก์บนเครื่องนี้เพื่อเข้าระบบ</span>
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            เข้าระบบด้วยอีเมลเพื่อใช้งานและซิงค์ข้อมูล (ส่งลิงก์เข้าอีเมล ไม่มีรหัสผ่าน)
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="email" inputMode="email" autoComplete="email"
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <Button size="sm" onClick={() => void send()} disabled={busy}>ส่งลิงก์</Button>
          </div>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: เพิ่ม offline/error banner ใน `routine-app.tsx`**

หลัง `const syncError = ...` (เพิ่ม selector):

```ts
  const syncError = useAppStore((s) => s.syncError);
```

แทรกก่อน `<Tabs ...>` ภายใน fragment ที่ return:

```tsx
      {syncError && (
        <div className="bg-destructive/10 px-4 py-1.5 text-center text-xs text-destructive">
          {syncError}
        </div>
      )}
```

- [ ] **Step 4: type-check + lint + build**

Run: `bunx tsc --noEmit && bun run lint && bun run build`
Expected: build สำเร็จ (ไม่มี static export แล้ว — เป็น server build), ไม่มี error

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(client): login gating, offline banner, one-time legacy migration"
```

---

## Task 12: Docs + final verification

**Files:**
- Modify: `docs/supabase-setup.md`

**Interfaces:**
- Produces: เอกสาร setup ใหม่ + ยืนยันทุกอย่างผ่าน

- [ ] **Step 1: เขียน `docs/supabase-setup.md` ใหม่**

แทนเนื้อหาทั้งไฟล์ด้วยขั้นตอนใหม่: (1) สร้าง Supabase project, (2) env ทั้ง 4 ตัว (`NEXT_PUBLIC_SUPABASE_URL`, publishable key, `DATABASE_URL` pooler, `DIRECT_URL`), (3) `bunx prisma migrate deploy`, (4) ตั้ง Auth URL (Site URL + Redirect URLs), (5) deploy บน Vercel + ตั้ง env ทั้ง 4 ในแดชบอร์ด, (6) อธิบายว่าใช้งานต้อง login + ออนไลน์ และมี one-time migration จาก localStorage เดิมอัตโนมัติ

เนื้อหา:

```markdown
# ตั้งค่า Supabase + Prisma backend

แอปเก็บข้อมูล (`log`, `swaps`, `checked`, `profileOverride`) บน Postgres ผ่าน Prisma
ใช้งาน **ต้องเข้าสู่ระบบ + ออนไลน์** (ไม่ใช่ offline-first แล้ว)

## 1) สร้าง Supabase project
1. https://supabase.com → New project (จด database password ไว้)
2. Settings → API → คัดลอก **Project URL** + **publishable key** (`sb_publishable_...`)
3. Settings → Database → Connection string → คัดลอกทั้ง **pooler (6543)** และ **direct (5432)**

## 2) ใส่ env (`.env` ตอน dev, แดชบอร์ด host ตอน deploy)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DATABASE_URL=postgresql://...pooler...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres
```

## 3) สร้างตาราง (Prisma migrate)
```bash
bunx prisma migrate deploy   # production
# หรือ dev: bunx prisma migrate dev
```

## 4) ตั้ง Auth (magic link)
- Authentication → Providers → เปิด Email (ค่าเริ่มต้นเปิด)
- Authentication → URL Configuration → ใส่ Site URL + Redirect URLs ให้ตรงกับ dev/prod

## 5) Deploy (Vercel)
- ไม่ใช่ static export แล้ว — Vercel จะรันเป็น Next.js server อัตโนมัติ
- ตั้ง env ทั้ง 4 ตัวในแดชบอร์ด Vercel
- build command รัน `prisma generate` ผ่าน `postinstall` อยู่แล้ว

## การย้ายข้อมูลเดิม
ผู้ใช้ที่เคยใช้เวอร์ชัน offline เดิม: เมื่อ login ครั้งแรก ข้อมูลใน localStorage
จะถูกย้ายขึ้น backend อัตโนมัติครั้งเดียว (idempotent)
```

- [ ] **Step 2: รัน verification ครบชุด**

Run: `bun test src/lib && bunx tsc --noEmit && bun run lint && bun run build`
Expected: เทสต์ผ่านทั้งหมด, ไม่มี type error, lint ผ่าน, build สำเร็จ

- [ ] **Step 3: Manual smoke test (dev)**

Run: `bun run dev` → เปิด `http://localhost:3000`
ตรวจ:
1. ยังไม่ login → การ์ด "เข้าสู่ระบบ" โชว์ฟอร์มอีเมล; ติ๊ก/จดเวตจะขึ้น banner error (ยังไม่ login)
2. กรอกอีเมล → ส่งลิงก์ → เปิดลิงก์จากอีเมล → login สำเร็จ
3. หลัง login: จดน้ำหนัก/ติ๊กมื้อ/จดเวต → reload หน้า → ข้อมูลยังอยู่ (มาจาก backend)
4. ปิดเน็ต → แก้ค่า → ขึ้น banner "ออฟไลน์ ยังไม่บันทึก" + ค่า rollback

- [ ] **Step 4: Commit**

```bash
git add docs/supabase-setup.md
git commit -m "docs: rewrite setup guide for Prisma backend"
```

---

## Self-Review Notes

- **Spec coverage:** ทุกส่วนของสเปค (schema 6 ตาราง, endpoints ทั้ง 7 กลุ่ม, auth, cache `use cache`, online-required store, migration, error handling, testing, deploy) มี task รองรับครบ
- **`use cache` / Next 16:** ใช้ `use cache` + `cacheTag` + `revalidateTag(tag,'max')`, `await params`, `cacheComponents:true` — ตรงตาม docs ที่อ่าน
- **Type consistency:** `SyncSlice`/`StateRows`/`SeedRows` นิยามใน Task 2 ใช้ตรงกันใน Task 4/7; action signatures ของ store (Task 9) ตรงกับที่ `routine-app.tsx`/views เรียกอยู่เดิม จึงไม่ต้องแก้ component อื่น
- **ลำดับ build เขียว:** Task 9 รวม (store + ลบ sync engine + rewire app) ไว้ใน commit เดียว ทุก commit จึง build เขียว; Task 10 เดิมถูก merge เข้า Task 9 (ข้าม)
- **ความปลอดภัย:** Task 1 เปิด RLS deny-all ทุกตาราง ปิดช่องที่ PostgREST เปิด public schema ให้ publishable key — Prisma (role postgres) bypass RLS จึงยังทำงาน
```
