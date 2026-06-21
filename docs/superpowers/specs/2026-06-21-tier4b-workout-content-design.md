# Tier 4B — คอนเทนต์ออกกำลัง: ฟอร์มท่า (cue) + คู่มือ progression

วันที่: 2026-06-21
สถานะ: รออนุมัติ

## เป้าหมาย

เพิ่มคอนเทนต์ฝั่งออกกำลัง 2 อย่าง:

1. **ฟอร์มท่า (cue)** — คำแนะนำสั้น ๆ วิธีทำท่าให้ถูก ต่อท่า (กางดูในการ์ดท่า)
2. **คู่มือ progression** — วิธีเพิ่มน้ำหนัก (double progression) + จังหวะ deload เป็นการ์ดแนะนำในแท็บออกกำลัง

ขอบเขตที่ **ไม่ทำ**: ไม่ผูกกับ logging (Tier 2), ไม่ทำ mesocycle/แผนเปลี่ยนตามสัปดาห์, cue บังคับเฉพาะท่าวันเล่นเวต (คาร์ดิโอ/แกนกลางไม่บังคับ), ไม่มีวิดีโอ/ลิงก์นอก (CSP)

## หลักการ

cue เก็บเป็น **map แยก keyed ด้วยชื่อท่า** (ไม่แตะ type `Exercise` หรือ `week.ts`) — ท่าเดียวกันที่โผล่หลายวันใช้ cue ชุดเดียว การ์ดท่าดึง cue จากชื่อ ใช้ `<details>` เปิด-ปิด (native ไม่ต้องเป็น client component)

## 1) ฟอร์มท่า (cue)

**ข้อมูล** (`src/data/workout-guide.ts` ใหม่):
```ts
export const exerciseCues: Record<string, string[]> = { /* ชื่อท่า → 3-4 cue */ };
```
- ครอบคลุม **15 ท่าในวันเล่นเวต** (ชื่อตรงกับ `week.ts` เป๊ะ):
  - Full Body A: `Barbell Squat`, `Bench Press`, `Bent-over Row`, `Overhead Press`, `Plank`
  - Full Body B: `Deadlift`, `Incline Dumbbell Press`, `Lat Pulldown / Pull-up`, `Walking Lunge`, `Hanging Knee Raise`
  - Full Body C: `Romanian Deadlift`, `Dumbbell Shoulder Press`, `Seated Cable Row`, `Goblet Squat`, `Dumbbell Curl + Triceps Pushdown (ซูเปอร์เซ็ต)`
- แต่ละท่า cue 3-4 ข้อ (ตั้งท่า → จุดสำคัญ → ข้อผิดที่พบบ่อย) ภาษาไทยมือใหม่เข้าใจ

ตัวอย่างรูปแบบ:
```ts
"Barbell Squat": [
  "วางบาร์บนกล้ามหลังบ่า (ไม่ใช่คอ) เท้ากว้างเท่าหัวไหล่ ปลายเท้าเปิดเล็กน้อย",
  "ย่อโดยดันสะโพกไปข้างหลังเหมือนนั่งเก้าอี้ เข่าไปทางปลายเท้า หลังตรง",
  "ลงจนต้นขาขนานพื้น แล้วดันส้นเท้าขึ้น",
  "ข้อผิดที่พบบ่อย: เข่าหุบเข้า / ส้นเท้าลอย — คุมเข่าให้บานออก กดส้นเท้าติดพื้น",
],
```

**UI** ([exercise-card.tsx](src/components/exercise-card.tsx)): หลังแถวเซ็ต/ครั้ง/พัก ถ้ามี `exerciseCues[exercise.name]` แสดง:
```tsx
<details className="mt-2">
  <summary className="cursor-pointer text-xs font-medium text-primary">ดูฟอร์ม</summary>
  <ul> ...cue เป็น bullet... </ul>
</details>
```
(ไม่ต้องเพิ่ม `"use client"` — `<details>` ทำงาน native)

## 2) คู่มือ progression

**ข้อมูล** (`workout-guide.ts`): `export const progressionTips: string[]` — เนื้อหา:
- เป้า rep เป็น "ช่วง" (เช่น 6-8): ทำให้ได้ช่วงล่างก่อน แล้วไต่ขึ้น
- **double progression**: ทำครบช่วงบน (เช่น 8 ครั้ง) ทุกเซ็ตเมื่อไหร่ → ครั้งหน้าเพิ่มน้ำหนัก ~2.5 กก. แล้วเริ่มที่ช่วงล่างใหม่
- ยังไม่ถึงช่วงบน → คงน้ำหนักเดิม เพิ่มจำนวนครั้งไปเรื่อย ๆ
- **deload**: ทุก ~6 สัปดาห์ ลดน้ำหนัก ~40-50% 1 สัปดาห์ ให้ข้อต่อ/ระบบประสาทฟื้น
- progressive overload (ค่อย ๆ เพิ่มภาระ) = หัวใจของการสร้างกล้าม

**UI** ([workout-view.tsx](src/components/views/workout-view.tsx)): การ์ด "เพิ่มน้ำหนักยังไง (progression)" ท้ายหน้า (หลังคูลดาวน์) ใช้ `BulletList` เดิม — แสดงเฉพาะวันเล่นเวต (วันพัก return early อยู่แล้ว; คาร์ดิโอมี workout แต่ไม่ต้องโชว์ → เช็ค `day.type === "weights"`)

## ไฟล์ที่แตะ

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/data/workout-guide.ts` (ใหม่) | `exerciseCues` (15 ท่า) + `progressionTips` |
| `src/data/index.ts` | export `exerciseCues`, `progressionTips` |
| `src/components/exercise-card.tsx` | + `<details>` ดูฟอร์ม (lookup ตามชื่อ) |
| `src/components/views/workout-view.tsx` | + การ์ด progression (วันเล่นเวต) |
| `src/lib/workout-guide.test.ts` (ใหม่) | เทสต์ referential + เนื้อหา |

## การทดสอบ / ตรวจรับ

- **TDD** `workout-guide.test.ts`:
  - **Referential**: ทุก `exercise.name` ในวัน `type === "weights"` ของ `week` มีอยู่ใน `exerciseCues` (กันลืมท่า) → ควรครบ 15 ท่า
  - cue ทุก array ความยาว ≥ 3
  - `progressionTips.length` ≥ 3
- `bun test src/lib` เขียวทั้งหมด · `bun run build` ผ่าน
- ตรวจเบราว์เซอร์: แท็บออกกำลัง (วันเล่นเวต) — แต่ละท่ามี "ดูฟอร์ม" กางเห็น cue; ท้ายหน้ามีการ์ด progression; วันคาร์ดิโอ/พักไม่มีการ์ด progression
