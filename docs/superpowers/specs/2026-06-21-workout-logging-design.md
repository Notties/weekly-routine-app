# Workout Logging + Progressive Overload — บันทึกเซ็ตจริง + แนะนำเพิ่มน้ำหนัก

วันที่: 2026-06-21
สถานะ: รออนุมัติ

## เป้าหมาย

บันทึก **น้ำหนัก × ครั้ง ต่อเซ็ต** ที่ทำได้จริงในแต่ละท่า (เฉพาะวันนี้) เทียบกับ **ครั้งก่อน** ของท่าเดียวกัน แล้วแนะนำ progression แบบ **double progression** (ทำครบช่วงบนทุกเซ็ต → เพิ่มน้ำหนัก) ต่อยอดจากการ์ด progression (Tier 4B) ให้เป็นคำแนะนำเฉพาะท่า

ขอบเขตที่ **ไม่ทำ**: ไม่ทำกราฟ volume/PR (เฟสถัดไป), แก้/บันทึกได้เฉพาะ "วันนี้" (เหมือน meal/water/workoutDone), ไม่แตะ type `Exercise`/`week.ts`, แนะนำ progression เฉพาะท่าที่ reps เป็นตัวเลข/ช่วง (เช่น `"6–8"`, `"8"`) — ท่าแบบ `"12 ก้าว/ข้าง"`, `"45 วิ"`, `"12+12"` บันทึกได้แต่ไม่แนะนำ

## โมเดลข้อมูล (`src/data/types.ts`)

```ts
export type SetEntry = { kg: number; reps: number };
// DayLog เพิ่ม:
lifts?: Record<string, SetEntry[]>; // key = ชื่อท่า (ตรงกับ week.ts)
```
เก็บใน `log` เดิม → persist อัตโนมัติ (อยู่ใน `partialize` แล้ว)

## ตรรกะ (`src/lib/workout.ts` — มีเทสต์)

```ts
/** ช่วง rep จาก reps string: "6–8"/"8-10" → {low,high}; "8" → {8,8}; อื่น ๆ → null */
export function parseRepRange(reps: string): { low: number; high: number } | null

/** เซ็ตที่บันทึกล่าสุดของท่า ก่อนวัน beforeISO (มี reps>0) */
export function lastLift(log, exercise, beforeISO): { date: ISODate; sets: SetEntry[] } | null

/** double progression: ทุกเซ็ตที่น้ำหนักสูงสุดทำครบ high → เพิ่ม step กก. ; ไม่ครบ → คงน้ำหนัก */
export function suggestProgression(reps, last, step=2.5):
  { kind: "increase"|"hold"|"none"; text: string; targetKg?: number }
```

## Store (`src/lib/store.ts`)

- `logSet(date, exercise, index, kg, reps)` — ขยาย array ให้ถึง index แล้วเซ็ตค่า
- `clearLift(date, exercise)` — ลบทั้งท่า

## UI

- `src/components/views/workout-view.tsx`: ส่ง `todayISO` ลง `ExerciseCard`
- `src/components/exercise-card.tsx`: ถ้า `isToday` แสดง `<SetLogger>`
- `src/components/set-logger.tsx` (ใหม่, client): `<details>` "บันทึกเซ็ต"
  - แถวอินพุต = จำนวนเซ็ต (`exercise.sets`) แต่ละแถว: น้ำหนัก(กก.) × ครั้ง — commit ตอน blur
  - บรรทัด "ครั้งก่อน (วันที่): 50×8, 50×8, …" ถ้ามี
  - chip คำแนะนำ progression (เขียวถ้า increase)
  - ปุ่ม "ล้าง" เมื่อมีข้อมูล

## ไฟล์ที่แตะ

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/data/types.ts` | `SetEntry` + `DayLog.lifts` |
| `src/lib/workout.ts` | `parseRepRange`, `lastLift`, `suggestProgression` |
| `src/lib/workout.test.ts` | เทสต์ตรรกะ progression |
| `src/lib/store.ts` | `logSet`, `clearLift` |
| `src/components/set-logger.tsx` (ใหม่) | UI บันทึกเซ็ต |
| `src/components/exercise-card.tsx` | แสดง SetLogger (วันนี้) |
| `src/components/views/workout-view.tsx` | ส่ง `todayISO` |

## การทดสอบ / ตรวจรับ

- `workout.test.ts`:
  - `parseRepRange("6–8")={low:6,high:8}`, `("8")={8,8}`, `("12 ก้าว/ข้าง")=null`
  - `lastLift` เลือกวันล่าสุดก่อน today ที่มี reps>0
  - `suggestProgression`: ครบ high ทุกเซ็ต → `increase` targetKg=+2.5 ; ไม่ครบ → `hold` ; ไม่มี last → `none`
- `bun test src/lib` เขียว · `bun run build` ผ่าน
- เบราว์เซอร์: วันเล่นเวต (วันนี้) — กาง "บันทึกเซ็ต" กรอกน้ำหนัก×ครั้ง, รีโหลดยังอยู่; วันถัดไปของท่าเดิมโชว์ "ครั้งก่อน" + คำแนะนำ; วันที่ไม่ใช่วันนี้ไม่มีฟอร์ม
