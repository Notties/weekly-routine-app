# Design: ย้ายจาก Supabase-sync (offline-first blob) → Prisma relational backend

วันที่: 2026-06-22

## บริบทและแรงจูงใจ

แอปปัจจุบันเป็น **Next.js static export** (`output: "export"`) แบบ offline-first:
localStorage เป็น source of truth, ซิงค์ขึ้น Supabase เป็น jsonb blob ก้อนเดียวต่อผู้ใช้
(`user_state.data`) ผ่าน sync engine (pull-merge-push) + auth magic-link

ผู้ใช้เลือกย้ายไป **server + Prisma + relational** เพื่อ DX และความยืดหยุ่นระยะยาว
(ยอมรับว่าไม่มีฟีเจอร์เจาะจงที่ blob ทำไม่ได้ — เป็นการลงทุนเชิงสถาปัตยกรรมโดยรู้ต้นทุน)

> **ต้นทุนที่ยอมรับแล้ว:** เลิก static export, เลิก offline-first, ใช้งานต้อง login + ออนไลน์,
> ดูแล connection string + ความปลอดภัยย้ายจาก RLS มาอยู่ที่โค้ด server

## Decisions ที่ล็อกแล้ว

| ประเด็น | เลือก |
|---|---|
| สถาปัตยกรรม | Server + Prisma เต็มรูปแบบ (เลิก static export) |
| โฮสต์ | Vercel serverless |
| ฐานข้อมูล + auth | Supabase Postgres (ผ่าน pooler) + Supabase Auth magic-link เดิม |
| Cache | Next.js Data Cache (`unstable_cache` + `revalidateTag`) |
| โมเดล sync | online-required, Postgres เป็น source of truth, CRUD API, ตัด sync engine |
| Schema | relational เต็มรูปแบบ (ทุกเซ็ตเวต = 1 row) |

## 1. สถาปัตยกรรมรวม & request flow

```
เบราว์เซอร์ (Next.js client)
  │  ทุก request แนบ  Authorization: Bearer <supabase access token>
  ▼
Next.js Route Handlers (/api/*)  ← Vercel serverless
  │  1. verify token → userId   (supabase.auth.getUser(token))
  │  2. Prisma query/mutation    (บังคับ where userId เสมอ)
  │  3. read: ห่อ unstable_cache tag `state:{userId}`
  │     write: revalidateTag(`state:{userId}`)
  ▼
Supabase Postgres  ← Prisma ต่อผ่าน pooler (6543, pgbouncer=true)
```

**จุดเปลี่ยนสำคัญ:**
- เลิก `output: "export"` → เป็น Next.js app ที่มี server (Vercel ดูแล)
- **ความปลอดภัยย้ายจาก RLS → โค้ด server** เพราะ Prisma ต่อ DB ด้วย connection สิทธิ์เต็ม
  (`DATABASE_URL`) RLS ไม่ถูกใช้แล้ว — ทุก route ต้อง verify token แล้ว filter `userId` เองเสมอ
- เลิก localStorage-persist + sync engine (`sync.ts`, `use-sync.ts`) — store เป็น in-memory
  hydrate จาก API

## 2. Database schema (Prisma, fully relational)

`prisma/schema.prisma` — 6 models, อ้าง `userId` (uuid จาก `auth.users`):

```prisma
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
  key      String              // เช่น "mon-lunch"
  recipeId String
  @@unique([userId, key])
  @@index([userId])
}

model CheckedItem {            // มี row = ติ๊กแล้ว (รายการช้อป)
  id     String @id @default(cuid())
  userId String @db.Uuid
  key    String
  @@unique([userId, key])
  @@index([userId])
}

model DayLog {
  id           String      @id @default(cuid())
  userId       String      @db.Uuid
  date         String      // "YYYY-MM-DD" (local date เก็บเป็น string กัน timezone เพี้ยน)
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

model MealCheck {             // มี row = มื้อ index นี้ทำแล้ว
  id        String @id @default(cuid())
  dayLogId  String
  mealIndex Int
  dayLog    DayLog @relation(fields: [dayLogId], references: [id], onDelete: Cascade)
  @@unique([dayLogId, mealIndex])
}

model LiftSet {               // 1 เซ็ตเวต = 1 row ← หัวใจ relational
  id       String @id @default(cuid())
  dayLogId String
  exercise String             // ชื่อท่า ตรงกับ week.ts
  setIndex Int
  kg       Float
  reps     Int
  dayLog   DayLog @relation(fields: [dayLogId], references: [id], onDelete: Cascade)
  @@unique([dayLogId, exercise, setIndex])
  @@index([exercise])         // ไว้ query PR/volume ข้ามวันต่อท่า
}
```

**หมายเหตุการออกแบบ:**
- `date` เก็บเป็น string `"YYYY-MM-DD"` ตรงกับ `ISODate` เดิม — กันปัญหา timezone แปลงวันเพี้ยน
- `MealCheck`/`CheckedItem` ใช้ "มี row = true" (เลียน `Record<x, true>` เดิม) — ติ๊กออก = ลบ row
- `@@index([exercise])` เปิดทางทำกราฟ progress / PR ต่อท่าด้วย SQL ตรง
- ไม่มีตาราง `User` แยก — อ้าง `auth.users` ของ Supabase ตรงๆ

## 3. API design & auth

ทุก route ใต้ `src/app/api/` แนบ `Authorization: Bearer <token>` helper เดียวคุม auth:

```ts
// src/lib/api/auth.ts
async function requireUser(req): Promise<{ userId: string } | 401>
//   supabase.auth.getUser(token) ด้วย anon client; ไม่ผ่าน = 401
//   (ไม่ต้องใช้ service-role key)
```

**Endpoints** — map ตรงกับ action ใน store เดิม (granular, cache-friendly):

| Method + path | แทน action เดิม |
|---|---|
| `GET /api/state` | โหลดครั้งแรก → ประกอบ `SyncSlice` จากทุกตาราง (ห่อ `unstable_cache`) |
| `PUT /api/profile` | `setProfileField` (ส่งทั้ง object) |
| `PUT /api/days/[date]` | `logWeight`/`setWorkoutDone`/`addWater`/`addExtra`/`clearExtra` (patch scalar) |
| `PUT /api/days/[date]/meals/[i]` · `DELETE` | `toggleMeal` |
| `PUT /api/days/[date]/lifts/[exercise]` · `DELETE` | `logSet` (ส่งทั้ง array) / `clearLift` |
| `PUT /api/swaps/[key]` · `DELETE` | `setSwap` / `clearSwap` |
| `PUT /api/checked/[key]` · `DELETE` · `DELETE /api/checked` | `toggleChecked` / `clearChecked` |

**กติการ่วม:**
- ทุก handler: `requireUser` → validate body (zod) → Prisma (filter `userId` เสมอ) →
  `revalidateTag('state:'+userId)` ถ้าเป็น write
- `GET /api/state` ห่อด้วย `unstable_cache(fn, ['state', userId], { tags: ['state:'+userId] })`
- คืน status ตรงความหมาย: 200/204, 400 (validation), 401 (auth), 500
- `logSet` ส่งทั้ง array ของท่านั้น → server ลบ-แล้ว-ใส่ใหม่ใน transaction
- pure helper คู่ `rowsToSlice` / `sliceToRows` แยกไว้เทสต์ (จุดเสี่ยงสุด)

## 4. ฝั่ง client & การย้ายข้อมูลเดิม

**Store (`store.ts`) → online + optimistic:**
- ตัด `persist`/localStorage — store in-memory hydrate จาก `GET /api/state` ตอนเปิดแอป
- ทุก action: optimistic update → ยิง API → error ค่อย rollback + แจ้งเตือน
- เพิ่ม `src/lib/api/client.ts` — fetch wrapper แนบ token (จาก `getSupabase().auth.getSession()`)
- ลบ: `sync.ts`, `use-sync.ts`, `sync.test.ts` · คง `supabase.ts` (ใช้ auth)
- `sync-card.tsx` คงไว้ แต่เปลี่ยนความหมาย "ซิงค์" → "เข้าสู่ระบบ"

**สถานะ offline / ยังไม่ login:**
- ยังไม่ login → หน้าชวน login (content static เช่นเมนู/ตารางดูได้ แต่ติ๊ก/จดเวตไม่ได้)
- เน็ตหลุด → optimistic ค้างไว้ + banner "ออฟไลน์ ยังไม่บันทึก" + retry เมื่อกลับมา

**Migration ข้อมูลเดิม (กันข้อมูลหาย):**
1. login สำเร็จครั้งแรกหลังอัปเกรด → เช็คมี localStorage `knot-gym` เก่า + ยังไม่เคยย้าย
2. มี → `POST /api/migrate` ส่ง `SyncSlice` ขึ้นไป (server upsert idempotent)
3. สำเร็จ → ตั้ง flag `knot-gym-migrated` ใน localStorage กันย้ายซ้ำ

## 5. Error handling, testing & deployment

**Error handling:**
- Server: ทุก handler ครอบ try/catch กลาง → JSON `{ error }` + status; zod คืน 400 ระบุ field
- Client: `client.ts` แยก 401 (re-login) / network (offline-banner + retry) / 5xx (toast + rollback)
- Prisma `P2002` (unique ชน) → upsert แทน throw

**Testing (`bun test`):**
- pure helper `rowsToSlice`/`sliceToRows` — เทสต์ round-trip หนักสุด
- route handlers — integration test (mock `requireUser` + Prisma test DB/mock) ครอบ 401/400/ownership
- เทสต์ logic เดิม (`nutrition`/`meals`/`tracking`/...) ไม่แตะ · ลบ `sync.test.ts`

**Deployment & env:**
- `next.config.ts`: เอา `output: "export"` ออก
- env ใหม่: `DATABASE_URL` (pooler 6543, `pgbouncer=true`), `DIRECT_URL` (5432, สำหรับ migrate);
  คง `NEXT_PUBLIC_SUPABASE_URL` + publishable key (auth)
- build: `prisma generate` (postinstall) + `prisma migrate deploy`
- Vercel: ตั้ง env ทั้งหมดในแดชบอร์ด
- `package.json`: เพิ่ม `prisma`, `@prisma/client`; script `db:migrate`, `db:generate`

**ผลกระทบที่ยอมรับ:** เลิก `bunx serve out` (ใช้ `next start`/Vercel); ใช้งานต้อง login + ออนไลน์

## ไฟล์ที่เกี่ยวข้อง

**เพิ่ม:** `prisma/schema.prisma`, `src/lib/api/{auth,client}.ts`, `src/lib/api/state-mapper.ts`
(`rowsToSlice`/`sliceToRows` + เทสต์), `src/app/api/**/route.ts`, `src/lib/prisma.ts` (singleton)

**แก้:** `store.ts` (ตัด persist + optimistic), `next.config.ts`, `package.json`,
`.env`/`.env.example`, `sync-card.tsx`, `supabase-setup.md`

**ลบ:** `sync.ts`, `use-sync.ts`, `sync.test.ts`
