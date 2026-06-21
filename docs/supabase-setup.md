# ตั้งค่า Supabase Cloud Sync

sync ข้อมูล (`log`, `swaps`, `checked`, `profileOverride`) ข้ามอุปกรณ์แบบ offline-first
ถ้าไม่ตั้งค่า แอปจะทำงานออฟไลน์ (localStorage) เหมือนเดิมทุกอย่าง

## 1) สร้าง Supabase project

1. ไปที่ https://supabase.com → New project
2. Settings → API → คัดลอก **Project URL** และ **anon public key**

## 2) ใส่ env

คัดลอก `.env.example` เป็น `.env.local` แล้วเติมค่า:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> ค่าเหล่านี้ inlined ตอน `bun run build` (static export) — anon key เปิดเผยได้ ความปลอดภัยมาจาก RLS ด้านล่าง
> ตอน deploy (Vercel/Netlify) ให้ตั้ง env สองตัวนี้ในแดชบอร์ดของผู้ให้บริการด้วย

## 3) สร้างตาราง + RLS

Supabase → SQL Editor → รัน:

```sql
create table if not exists public.user_state (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "own row - select" on public.user_state
  for select using (auth.uid() = user_id);
create policy "own row - insert" on public.user_state
  for insert with check (auth.uid() = user_id);
create policy "own row - update" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 4) ตั้ง Auth (magic link)

- Supabase → Authentication → Providers → เปิด **Email** (ค่าเริ่มต้นเปิดอยู่)
- Authentication → URL Configuration → ใส่ **Site URL** และ **Redirect URLs** ให้ตรงกับที่ deploy
  (เช่น `http://localhost:3000` ตอน dev และโดเมนจริงตอน production)

## 5) ใช้งาน

เปิดแอป → แท็บโปรไฟล์ (แตะรูปโปรไฟล์มุมบน) → การ์ด **"ซิงค์คลาวด์"** → กรอกอีเมล → กด "ส่งลิงก์"
เปิดลิงก์ในอีเมลบนเครื่องเดียวกัน → เข้าระบบและซิงค์อัตโนมัติ
ทำซ้ำบนอีกเครื่องด้วยอีเมลเดียวกัน → ข้อมูลจะ merge เข้าหากัน

## การ merge (offline-first)

- local (localStorage) เป็นหลักเสมอ → ใช้ในยิมที่เน็ตไม่ดีได้
- ตอนซิงค์: ดึงของคลาวด์มา **union-merge** กับของในเครื่อง (ไม่ทำของฝั่งใดหาย)
  - คีย์ที่ชนกันใช้ฝั่งที่แก้ล่าสุด; `log` ราย "วัน" จะ union `meals`/`lifts` ไม่ทับทั้งวัน
- push ขึ้นคลาวด์อัตโนมัติหลังข้อมูลเปลี่ยน ~1.5 วิ และตอนเปิดแอป
