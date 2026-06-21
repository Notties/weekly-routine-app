# Rest Timer Implementation Plan

**Goal:** ปุ่มพักในการ์ดท่า → แถบจับเวลา sticky ล่างจอ (นับถอยหลัง + สั่น/บี๊บเมื่อครบ) ค้างข้ามแท็บ

**Architecture:** timer state เก็บใน zustand store เป็น `restEndsAt` (timestamp) — ไม่ persist · `RestTimerBar` ตัวเดียว mount ที่ root (นอก `Tabs`) เดิน interval คำนวณเวลาที่เหลือ · ExerciseCard (client) แตะค่าพัก → `startRest`

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript, Tailwind v4, zustand, lucide-react, `bun test`

## Global Constraints

- ใช้ค่าจาก `rest` เท่านั้น (ไม่ตั้งเอง); parse เฉพาะ `"NN วิ"`
- timer ไม่ persist (อยู่นอก `partialize`)
- เสียง/สั่นใช้ Web Audio + `navigator.vibrate` แบบ optional (try/catch, ไม่มี = เงียบ)
- สไตล์เดิม (`rounded-*`, `border-border`, `tnum`)

---

## Task 1: parseRestSeconds + เทสต์ (TDD)

- [ ] เขียน `src/lib/workout.test.ts` (เคส parse: `"120 วิ"→120`, `"45 วิ"→45`, `"-"→null`, `"คาบในเซ็ต"→null`, `"35 นาที โซน 2"→null`)
- [ ] รัน fail (module ไม่มี)
- [ ] สร้าง `src/lib/workout.ts` + `parseRestSeconds`
- [ ] `bun test src/lib` ผ่าน

## Task 2: store timer state

- [ ] เพิ่ม `restEndsAt`, `restTotal` + actions `startRest`/`addRest`/`stopRest` (ไม่ใส่ใน `partialize`)

## Task 3: RestTimerBar + ปุ่มพัก + mount

- [ ] สร้าง `src/components/rest-timer-bar.tsx` (client): interval 200ms, progress, +15/หยุด, สั่น+บี๊บเมื่อครบ, auto-clear ~4 วิ
- [ ] `exercise-card.tsx` → `"use client"`, ค่าพักเป็นปุ่มถ้า `parseRestSeconds`≠null
- [ ] mount `<RestTimerBar />` ใน `routine-app.tsx` (นอก `Tabs`)
- [ ] `bun run build` ผ่าน · ตรวจเบราว์เซอร์ · commit
