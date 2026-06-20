# ตารางรูทีนฟิตเนสรายสัปดาห์ — Design Spec

วันที่: 2026-06-21
สถานะ: อนุมัติแล้ว (ผู้ใช้ยืนยัน "ลุยเลย")

## เป้าหมาย
เว็บแอปส่วนตัวสำหรับดูตารางรูทีนฟิตเนส + อาหาร + การนอน + รายการซื้อของรายสัปดาห์
เปิดบนมือถือเป็นหลัก ใช้คนเดียว ไม่มี backend

## โปรไฟล์ผู้ใช้
ชาย 25 ปี · สูง 167 ซม. · เป้าหมาย เพิ่มกล้าม–ลดไขมัน · ออกกำลังช่วง 19:00–20:00

## ทิศทางดีไซน์ (ผู้ใช้เลือกเอง)
- **Mood:** มินิมอลสะอาดตา
- **โทนสี:** ขาว-ดำล้วน **ไม่มีสีเน้น (no accent)** — แยกลำดับชั้นด้วยน้ำหนักตัวอักษร, เส้นขอบ, พื้นเทาอ่อน, ระยะห่าง
- **โหมด:** มีทั้ง Light/Dark + ปุ่มสลับ
- **ฟอนต์:** อ่านสบาย เรียบ (sans-serif รองรับไทย)
- **เลย์เอาต์:** ผสม ไทม์ไลน์ + การ์ด
- **เทค:** Next.js (TypeScript, App Router) + Tailwind CSS + shadcn/ui + custom style, ใช้ Bun

## สถาปัตยกรรม
- เว็บแอปฝั่ง client ล้วน ไม่มี backend / ไม่มี DB
- รองรับ static export (`output: 'export'`) เพื่อเอาไปวาง Vercel/Netlify หรือเปิดในเครื่อง
- โครงไฟล์:
  - `src/data/profile.ts` — โปรไฟล์
  - `src/data/week.ts` — ข้อมูล 7 วัน (จ–อา)
  - `src/data/shopping.ts` — รายการซื้อของ + ทิป (ดื่มน้ำ, การนอน)
  - `src/data/types.ts` — type ทั้งหมด
  - `src/lib/timeline.ts` — สร้าง/เรียงไทม์ไลน์ตามเวลา
  - `src/lib/shopping.ts` — คำนวณยอดรวม/งบสัปดาห์/เฉลี่ยต่อวัน
  - `src/lib/storage.ts` — อ่าน/เขียน localStorage (วันที่เลือก, ธีม, ติ๊กซื้อของ)
  - `src/components/*` — UI (DayPicker, Tabs, TimelineView, WorkoutView, MealView, SleepView, ShoppingView, ThemeToggle, การ์ดย่อย)
  - `src/app/*` — หน้า/เลย์เอาต์/ธีม provider
- **localStorage:** วันที่เลือกล่าสุด, โหมดธีม, สถานะติ๊กถูกรายการซื้อของ (key ตามชื่อรายการ)

## โมเดลข้อมูล
```ts
type DayType = 'weights' | 'cardio' | 'rest'

type Profile = {
  sex: string; age: number; heightCm: number;
  goal: string; workoutWindow: string;
}

type Exercise = {
  name: string; muscle: string;
  sets: number; reps: string;   // reps เป็น string รองรับ '8-12', 'AMRAP', '30 วิ'
  rest: string;                 // เวลาพักระหว่างเซ็ต เช่น '90 วิ'
}

type Meal = {
  time: string;      // 'HH:MM'
  name: string;      // ชื่อมื้อ เช่น 'มื้อเช้า'
  menu: string;      // เมนู
  steps: string[];   // วิธีทำสั้น ๆ 1-2-3
  tags: string[];    // เช่น 'ก่อนเล่น', 'หลังเล่น = ซ่อมกล้าม'
}

type Workout = {
  time: { start: string; end: string };  // ค่าเริ่มต้น 19:00–20:00
  warmup: string[];
  exercises: Exercise[];
  cooldown: string[];
}

type Sleep = {
  bedtime: string;   // 'HH:MM'
  wake: string;      // 'HH:MM'
  hours: number;
  note: string;
}

type Day = {
  key: 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';
  label: string;     // 'จันทร์'
  short: string;     // 'จ'
  type: DayType;
  title: string;     // 'Full Body A' / 'คาร์ดิโอ' / 'วันพัก'
  workout?: Workout; // ไม่มีในวันพัก
  meals: Meal[];
  sleep: Sleep;
}

type ShopCategory = 'โปรตีน'|'คาร์บ'|'ผัก'|'ผลไม้'|'ไขมันดี'|'เครื่องปรุง'

type ShopItem = {
  name: string;
  qty: string;       // ปริมาณ เช่น '1 กก.'
  price: number;     // บาท
  category: ShopCategory;
  recurring: boolean; // true = ของซื้อครั้งเดียวใช้นาน
}
```

## มุมมอง (แท็บ)
แถบเลือกวัน **จ–อา** อยู่บนสุด แสดงป้ายประเภท (เวต/คาร์ดิโอ/พัก)
แถบวันคุม 4 แท็บแรก ส่วนแท็บซื้อของเป็นระดับสัปดาห์ (ไม่ผูกกับวันที่เลือก)

1. **📋 รูทีน** — ไทม์ไลน์ทั้งวันเรียงตามเวลา:
   - ตื่น (sleep.wake) → มื้ออาหารเรียงตามเวลา → บล็อกออกกำลัง (workout.time.start) เฉพาะวันเวต/คาร์ดิโอ → ผ่อนคลายก่อนนอน → เข้านอน (sleep.bedtime)
   - การเรียงใช้เวลา (HH:MM) เป็นตัวจัดลำดับ → บล็อกออกกำลัง 19:00 จะมาก่อนมื้อหลังเล่นอัตโนมัติ
   - วันพัก: ไม่มีบล็อกออกกำลัง
   - ทุกมื้อในไทม์ไลน์แสดง step วิธีทำด้วย
2. **🏋️ ออกกำลัง** — เวลาเล่น + วอร์มอัพ + การ์ดรายการท่า (ชื่อ/กล้ามเนื้อ/เซ็ต×ครั้ง/พัก) + คูลดาวน์ · วันพักแสดงข้อความพัก
3. **🍱 อาหาร** — การ์ดทุกมื้อ + เมนู + step วิธีทำ + ป้ายกำกับ + แถบเตือนดื่มน้ำ
4. **😴 นอน** — เวลานอน/ตื่น/จำนวน ชม. + โน้ตของวัน + ทิปการนอน
5. **🛒 ซื้อของ** (ระดับสัปดาห์):
   - แบ่ง 6 หมวด: โปรตีน / คาร์บ / ผัก / ผลไม้ / ไขมันดี / เครื่องปรุง
   - แต่ละรายการ: ชื่อ / ปริมาณ / ราคา (บาท) + checkbox ติ๊กถูก (ติ๊กแล้วขีดฆ่า, จำสถานะใน localStorage)
   - คำนวณ: ยอดรวมแต่ละหมวด + ยอดรวมทั้งหมด
   - แยก "ของใช้นาน (recurring)" ออกจาก "ของรายสัปดาห์"
   - แสดง **งบสัปดาห์ถัดไป** = ผลรวมราคาของรายสัปดาห์ (recurring=false)
   - แสดง **เฉลี่ยต่อวัน** = งบสัปดาห์ถัดไป ÷ 7

## ตรรกะคำนวณ
- `buildTimeline(day)` → รวม entry { time, kind, payload } จาก wake / meals / workout / winddown / bedtime แล้ว sort ตาม time (HH:MM → นาที)
- `shoppingTotals(items)` → { byCategory, grandTotal, weeklyTotal(recurring=false), oneTimeTotal(recurring=true), perDay = weeklyTotal/7 }

## เนื้อหาเริ่มต้น
ใส่แผนตัวอย่างจริงครบ 7 วัน:
- จ/พ/ศ = Full Body A/B/C (เวต) · อ/พฤ = คาร์ดิโอ หรือสลับตามเหมาะสม · ส/อา = พัก/คาร์ดิโอเบา
- มื้ออาหารเน้นโปรตีนสไตล์เพิ่มกล้าม-ลดไขมัน พร้อม step สั้น ๆ และป้ายก่อน/หลังเล่น
- รายการซื้อของพร้อมราคาโดยประมาณ (บาท) แยก recurring/รายสัปดาห์
ผู้ใช้แก้ตัวเลข/เมนู/ท่าในไฟล์ `src/data` เองได้ภายหลัง

## Non-goals (YAGNI)
- ไม่มี backend/บัญชีผู้ใช้/ซิงก์คลาวด์
- ไม่มีระบบแก้ข้อมูลผ่าน UI (แก้ในไฟล์ data แทน ตามที่ผู้ใช้ต้องการ)
- ไม่มีการติดตามความคืบหน้า/บันทึกน้ำหนักที่ยกจริง (นอกขอบเขต)
- มีสถานะ persist เฉพาะ: ธีม, วันที่เลือก, ติ๊กซื้อของ
