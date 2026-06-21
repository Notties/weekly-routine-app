# Workout Logging + Progressive Overload Implementation Plan

**Goal:** บันทึกน้ำหนัก×ครั้งต่อเซ็ต (วันนี้) + เทียบครั้งก่อน + แนะนำ double progression เฉพาะท่า

**Architecture:** เก็บใน `DayLog.lifts` (key=ชื่อท่า) → persist กับ `log` เดิม · ตรรกะ progression อยู่ใน `src/lib/workout.ts` (pure, มีเทสต์) · `SetLogger` (client) ในการ์ดท่าเฉพาะวันนี้

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript, Tailwind v4, zustand, `bun test`

## Global Constraints

- แก้ได้เฉพาะ "วันนี้" (เหมือน meal/water); ไม่แตะ `Exercise`/`week.ts`
- progression เฉพาะ reps ที่เป็นตัวเลข/ช่วง; อื่น ๆ บันทึกได้แต่ไม่แนะนำ
- เพิ่มน้ำหนัก step 2.5 กก. (double progression)

---

## Task 1: types + ตรรกะ + เทสต์ (TDD)

- [ ] `types.ts`: `SetEntry` + `DayLog.lifts?`
- [ ] เพิ่มเทสต์ใน `src/lib/workout.test.ts`: `parseRepRange`, `lastLift`, `suggestProgression`
- [ ] เพิ่ม `parseRepRange`/`lastLift`/`suggestProgression` ใน `src/lib/workout.ts`
- [ ] `bun test src/lib` ผ่าน

## Task 2: store

- [ ] `logSet(date, exercise, index, kg, reps)` + `clearLift(date, exercise)`

## Task 3: UI

- [ ] สร้าง `src/components/set-logger.tsx` (client): แถวต่อเซ็ต (kg×reps, commit on blur), "ครั้งก่อน", chip คำแนะนำ, ปุ่มล้าง
- [ ] `exercise-card.tsx`: รับ `isToday`/`todayISO`, แสดง `<SetLogger>` เมื่อวันนี้
- [ ] `workout-view.tsx`: ส่ง `todayISO` ลงการ์ด
- [ ] `bun run build` ผ่าน · ตรวจเบราว์เซอร์ · commit
