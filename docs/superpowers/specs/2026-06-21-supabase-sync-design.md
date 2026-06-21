# Supabase Cloud Sync — sync ข้ามอุปกรณ์ (offline-first)

วันที่: 2026-06-21
สถานะ: รออนุมัติ

## เป้าหมาย

sync ข้อมูลผู้ใช้ (`log`, `swaps`, `checked`, `profileOverride`) ขึ้น Supabase เพื่อใช้ **หลายเครื่องให้ข้อมูลตรงกัน** + เป็น backup คลาวด์ โดย:
- **offline-first**: เขียน localStorage ก่อนเสมอ (zustand persist เดิม) แล้วค่อย sync ขึ้นคลาวด์เมื่อมีเน็ต — ใช้ในยิมที่เน็ตไม่ดีได้
- **ไม่พังของเดิม**: ถ้าไม่ตั้ง env คีย์ → sync ปิดเงียบ ๆ แอปทำงานออฟไลน์เหมือนเดิม (คงความเป็น static export)
- auth = **magic link (email OTP)** — ไม่มีรหัสผ่าน

ขอบเขตที่ **ไม่ทำ**: ไม่ทำ realtime live-update ระหว่างเครื่อง (sync ตอนเปิดแอป + ตอนข้อมูลเปลี่ยน), ไม่ย้าย `week/recipes` (เป็น static), ไม่ทำ conflict UI (ใช้ merge อัตโนมัติ)

## สถาปัตยกรรม

Supabase เป็น BaaS เรียกจาก browser ตรง ๆ → ยังคง static export (deploy ที่ไหนก็ได้) แค่เพิ่ม network call

```
zustand store (persist localStorage)  ◄──► useSync hook ◄──► Supabase (user_state jsonb + RLS)
        (source of truth ออฟไลน์)         (pull-merge-push)
```

### ตาราง Supabase
```sql
create table user_state (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table user_state enable row level security;
create policy "own row" on user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
(เก็บ SQL + วิธีตั้งใน `docs/supabase-setup.md`)

### Env (inlined ตอน build — static export)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
ไม่มี → `getSupabase()` คืน `null` → sync ปิด

## Merge (offline-first, union LWW) — `src/lib/sync.ts` (pure, มีเทสต์)

slice ที่ sync: `{ swaps, checked, log, profileOverride }`

```ts
mergeSlice(local, remote, localNewer): SyncSlice
```
- union ทุก map (ทั้งสองฝั่งไม่หายของกันและกัน); key ที่ชนกัน → ฝั่ง "ใหม่กว่า" ชนะ
- `log` merge ราย "วัน": วันที่ชนกัน → union ย่อย `meals`/`lifts` + ฟิลด์อื่นฝั่งใหม่ชนะ (กันข้อมูลทั้งวันหาย)
- `localNewer` = `localModifiedAt >= remote.updated_at`

## Store (`src/lib/store.ts`)

- `applyRemoteState(slice)` — set ทับ `swaps/checked/log/profileOverride` (จาก merge)
- selector ช่วย: ไม่ต้องเพิ่มเยอะ; hook อ่าน slice จาก store ตรง ๆ

## Sync layer

- `src/lib/supabase.ts` — `getSupabase()` (lazy, null-safe), `isSyncConfigured`
- `src/lib/use-sync.ts` (hook): จัดการ session, pull-merge-push, debounce push 1.5 วิ, ข้าม echo ตอน applyRemote, ฟัง auth change

## UI — `src/components/sync-card.tsx` (ใน MeView)

- ยังไม่ล็อกอิน: ช่องอีเมล → ปุ่ม "ส่งลิงก์เข้าระบบ" (magic link)
- ล็อกอินแล้ว: อีเมล + สถานะ ("ซิงค์ล่าสุด …") + ปุ่ม "ซิงค์เดี๋ยวนี้" + "ออกจากระบบ"
- ถ้า `!isSyncConfigured`: การ์ดบอก "ยังไม่ตั้งค่าคลาวด์ (ใช้งานออฟไลน์)"

## ไฟล์ที่แตะ

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `package.json` | + `@supabase/supabase-js` |
| `src/lib/sync.ts` (ใหม่) | merge logic |
| `src/lib/sync.test.ts` (ใหม่) | เทสต์ merge |
| `src/lib/supabase.ts` (ใหม่) | client null-safe |
| `src/lib/use-sync.ts` (ใหม่) | hook pull-merge-push |
| `src/lib/store.ts` | `applyRemoteState` |
| `src/components/sync-card.tsx` (ใหม่) | UI auth + สถานะ |
| `src/components/views/me-view.tsx` | แสดง SyncCard |
| `src/components/routine-app.tsx` | เรียก `useSync()` |
| `docs/supabase-setup.md` (ใหม่) | SQL + วิธีตั้งค่า |
| `.env.example` (ใหม่) | ตัวอย่าง env |

## การทดสอบ / ตรวจรับ

- `sync.test.ts`: union ไม่ทำของหาย, วันชนกัน merge `meals`/`lifts`, `localNewer` ชนะถูกฝั่ง
- `bun test src/lib` เขียว · `bun run build` **ผ่านโดยไม่มี env** (sync ปิด, แอปเดิมทำงาน)
- มี env + ตั้งตาราง: ส่ง magic link → ล็อกอิน → แก้ข้อมูลเครื่อง A → เปิดเครื่อง B เห็นข้อมูลตรงกัน
