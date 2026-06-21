# Tracking v2 — บันทึกอาหารนอกแผน (quick-add) + ปฏิทิน/heatmap ประวัติ

วันที่: 2026-06-21
สถานะ: รออนุมัติ

## เป้าหมาย

ต่อยอดระบบ tracking (Tier 1) 2 อย่าง:

1. **บันทึกอาหารนอกแผน (quick-add)** — เพิ่ม kcal + โปรตีนที่กินนอกเมนูในแผน เพื่อให้ยอดมาโครต่อวัน **ตรงความจริง** (ไม่ใช่นับแค่เมนูในแผน)
2. **ปฏิทิน/heatmap ประวัติ** — ดู adherence% ย้อนหลังแบบตารางสี (~8 สัปดาห์) ในหน้า "ฉัน"

ขอบเขตที่ **ไม่ทำ**: ไม่ itemize อาหารนอกแผน (เก็บเป็นยอดสะสม), extra ไม่กระทบ adherence%, heatmap แสดง adherence (น้ำหนักดูในกราฟเดิม), ไม่ค้นฐานข้อมูลอาหาร

## หลักการ

ทุกอย่างต่อจาก store + tracking เดิม (Tier 1): ข้อมูลอยู่ใน `useAppStore` (Zustand persist), ตรรกะคำนวณเป็นฟังก์ชันบริสุทธิ์ใน `lib/tracking.ts` (เทสต์ได้), UI แตะ store ผ่าน props/selector

## 1) บันทึกอาหารนอกแผน (quick-add)

**ข้อมูล** (`types.ts`): `DayLog` เพิ่ม
```ts
extra?: { kcal: number; protein: number };  // ยอดสะสมของอาหารนอกแผนในวันนั้น
```

**Store** (`store.ts`): เพิ่ม 2 actions
```ts
addExtra(date: ISODate, kcal: number, protein: number): void;  // บวกสะสม (กัน < 0)
clearExtra(date: ISODate): void;                                // ลบ extra ของวันนั้น
```

**พฤติกรรม:**
- กล่อง "อาหารนอกแผนวันนี้" บนแท็บอาหาร (เฉพาะ `isToday`): 2 ช่อง (kcal, โปรตีน) + ปุ่ม "เพิ่ม" (บวกเข้า extra สะสม) + แสดงยอด extra ปัจจุบัน + ปุ่ม "ล้าง" (เมื่อ extra > 0)
- **กล่องสรุปต่อวัน** (`DailyNutritionSummary`) แสดงยอดที่ **รวม extra แล้ว**: `kcal = แผน + extra.kcal`, `protein = แผน + extra.protein` (carb/fat คงจากแผน — extra ไม่แยก C/F)
- **adherence% ไม่เปลี่ยน** (คำนวณจากการติ๊กทำเสร็จของแผนเท่านั้น) — extra เป็นข้อมูลแยก

**UI ใหม่:** `components/extra-food-card.tsx` — รับ `extra`, `onAdd(kcal,protein)`, `onClear` เป็น props (ไม่แตะ store ตรง)

## 2) ปฏิทิน/heatmap ประวัติ

**ตรรกะ** (`lib/tracking.ts` + test): ฟังก์ชันบริสุทธิ์
```ts
type HeatCell = { date: ISODate; pct: number | null };  // null = วันอนาคต (ยังไม่ถึง)
function adherenceHistory(
  log: Record<ISODate, DayLog>,
  week: Day[],
  todayISO: ISODate,
  weeks: number,                 // เช่น 8
  waterTargetMl?: number
): HeatCell[];                    // ความยาว = weeks*7, จัดเรียงตามวันในสัปดาห์
```
- เริ่มที่ **วันอาทิตย์** ที่ตรงหรือก่อน (today − (weeks−1)×7 วัน) แล้วไล่ต่อเนื่อง weeks×7 วัน (ปฏิทินจัดคอลัมน์ = อา..ส)
- วัน ≤ today → `pct = dayAdherence(...)`; วัน > today → `pct = null`

**UI ใหม่:** `components/adherence-heatmap.tsx` — รับ `cells: HeatCell[]` + `log` (ไว้โชว์น้ำหนักตอนแตะ)
- ตาราง grid 7 คอลัมน์ × `weeks` แถว (`grid-cols-7`) ช่องสี่เหลี่ยมเล็ก: `null` → `bg-muted` จาง; `pct` → ความเข้มของ `bg-primary` ตาม % (เช่น opacity 4 ระดับ: 0/<50/<80/≥80) ; วันนี้มีขอบเน้น
- แตะช่อง (ที่ `pct !== null`) → state `selected` → โชว์บรรทัดสรุปใต้ตาราง: `"<วันที่ไทยสั้น> · <pct>% · น้ำหนัก <kg> กก."` (kg จาก `log[date]?.weightKg` ถ้ามี)
- วางใน `me-view.tsx` เป็น section ใหม่ "ประวัติความสม่ำเสมอ" (ใต้การ์ดสรุป)

## ไฟล์ที่แตะ

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/data/types.ts` | `DayLog` + `extra?: {kcal,protein}` |
| `src/lib/store.ts` | + `addExtra`, `clearExtra` |
| `src/lib/tracking.ts` | + `adherenceHistory`, type `HeatCell` |
| `src/lib/tracking.test.ts` | + เทสต์ `adherenceHistory` |
| `src/components/extra-food-card.tsx` (ใหม่) | การ์ด quick-add |
| `src/components/adherence-heatmap.tsx` (ใหม่) | ตาราง heatmap |
| `src/components/views/meal-view.tsx` | รวม extra ในยอดสรุป + วางการ์ด quick-add (วันนี้) |
| `src/components/views/me-view.tsx` | + section heatmap |
| `src/components/routine-app.tsx` | ส่ง `extra`/`addExtra`/`clearExtra` ลง meal-view; ส่ง cells/log ให้ me-view (หรือ me-view อ่าน store เอง) |

## การทดสอบ / ตรวจรับ

- **TDD** `adherenceHistory`:
  - ความยาว = `weeks*7`
  - cell แรกเป็นวันอาทิตย์ (`dayKeyForDate(cells[0].date) === "sun"`)
  - วันอนาคต (หลัง today) → `pct === null`
  - วันที่มี log ครบ → `pct` ตรงกับ `dayAdherence`
- `bun test src/lib` เขียวทั้งหมด (รวมเทสต์เดิม — extra/heatmap ไม่กระทบ balance/adherence เดิม) · `bun run build` ผ่าน
- ตรวจเบราว์เซอร์: แท็บอาหารมีการ์ด "อาหารนอกแผนวันนี้" → กรอก kcal+โปรตีน กดเพิ่ม → กล่องสรุปยอดขยับ (adherence เท่าเดิม) → ล้างได้; หน้า "ฉัน" มี heatmap 8 สัปดาห์ สีตาม % → แตะวันเห็นสรุป; รีเฟรชแล้ว extra/ประวัติคงอยู่ (persist)
