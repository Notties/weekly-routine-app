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
