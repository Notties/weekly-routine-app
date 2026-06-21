# Rest Timer — จับเวลาพักระหว่างเซ็ต

วันที่: 2026-06-21
สถานะ: รออนุมัติ

## เป้าหมาย

แต่ละท่ามีค่า `rest` อยู่แล้ว (เช่น `"120 วิ"`) — เพิ่มปุ่มแตะที่ค่าพักเพื่อ **เริ่มนับถอยหลัง** มีแถบจับเวลาติดล่างจอ (sticky) ที่ค้างอยู่แม้สลับแท็บ/เลื่อนหน้า + **สั่น/เสียงเตือน** เมื่อครบเวลา

ขอบเขตที่ **ไม่ทำ**: ไม่ตั้งเวลาเอง (ใช้ค่าจาก `rest` เท่านั้น), ไม่มีการ์ด timer แยกหน้า, ไม่ผูกกับ logging, ไม่เก็บ timer ลง localStorage (เป็นสถานะชั่วคราว)

## หลักการ

ใช้ **timestamp ปลายทาง** (`restEndsAt = Date.now() + วินาที*1000`) เก็บใน zustand store (ไม่ persist) เพื่อความแม่นยำแม้เบราว์เซอร์ throttle background — คอมโพเนนต์ `RestTimerBar` ตัวเดียว mount ที่ root ของแอป (นอก `Tabs` เพื่อไม่ถูก unmount ตอนสลับแท็บ) เดิน `setInterval` คำนวณเวลาที่เหลือ

## ตรรกะ (lib — มีเทสต์)

`src/lib/workout.ts` (ใหม่):
```ts
/** "120 วิ" → 120 ; รูปแบบอื่น ("-", "คาบในเซ็ต", "35 นาที…") → null */
export function parseRestSeconds(rest: string): number | null
```

## Store (`src/lib/store.ts`)

state (ไม่อยู่ใน `partialize` → ไม่ persist): `restEndsAt: number | null`, `restTotal: number | null`
actions: `startRest(seconds)`, `addRest(seconds)` (+เวลา), `stopRest()`

## UI

- `src/components/exercise-card.tsx` (เป็น client): ถ้า `parseRestSeconds(rest) !== null` ทำค่า "พัก" เป็นปุ่ม → `startRest(n)`
- `src/components/rest-timer-bar.tsx` (ใหม่, client): แถบ fixed ล่างจอ — เวลาที่เหลือ (ตัวใหญ่ tnum) + progress bar + ปุ่ม `+15` และ `หยุด`; ครบเวลา → `navigator.vibrate` + บี๊บสั้น (Web Audio) แล้วโชว์ "พักครบ" ก่อนปิดเองใน ~4 วิ
- mount `<RestTimerBar />` ใน `routine-app.tsx` (นอก `Tabs`)

## ไฟล์ที่แตะ

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/lib/workout.ts` (ใหม่) | `parseRestSeconds` |
| `src/lib/workout.test.ts` (ใหม่) | เทสต์ parse |
| `src/lib/store.ts` | timer state + actions |
| `src/components/rest-timer-bar.tsx` (ใหม่) | แถบจับเวลา |
| `src/components/exercise-card.tsx` | ปุ่มพัก |
| `src/components/routine-app.tsx` | mount bar |

## การทดสอบ / ตรวจรับ

- `workout.test.ts`: `parseRestSeconds("120 วิ")===120`, `("45 วิ")===45`, `("-")===null`, `("คาบในเซ็ต")===null`, `("35 นาที โซน 2")===null`
- `bun test src/lib` เขียว · `bun run build` ผ่าน
- เบราว์เซอร์: แท็บออกกำลัง แตะค่า "พัก 120 วิ" → แถบล่างนับถอยหลัง, `+15` เพิ่มเวลา, ครบแล้วสั่น/บี๊บ, สลับแท็บแล้ว timer ยังเดิน
