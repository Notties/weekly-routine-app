import type { ResolvedDay, Meal, Workout } from "@/data/types";

export type TimelineKind =
  | "wake"
  | "meal"
  | "workout"
  | "winddown"
  | "bedtime";

export type TimelineEntry = {
  /** เวลา "HH:MM" */
  time: string;
  /** เวลาในหน่วยนาที (ใช้เรียงลำดับ) */
  minutes: number;
  kind: TimelineKind;
  /** ป้าย/คำอธิบายสั้น ๆ */
  label?: string;
  meal?: Meal;
  workout?: Workout;
};

/** แปลง "HH:MM" เป็นจำนวนนาทีตั้งแต่เที่ยงคืน */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return h * 60 + (m || 0);
}

/** ลบนาทีออกจากเวลา "HH:MM" แล้วคืนค่าเป็น "HH:MM" (ไม่ข้ามวัน) */
function subtractMinutes(hhmm: string, delta: number): string {
  const total = Math.max(0, toMinutes(hhmm) - delta);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * สร้างไทม์ไลน์ทั้งวันเรียงตามเวลา:
 * ตื่น → มื้อต่าง ๆ → (บล็อกออกกำลังเฉพาะวันเวต/คาร์ดิโอ) → ผ่อนคลายก่อนนอน → เข้านอน
 * การเรียงใช้เวลา (นาที) เป็นหลัก จึงแทรกบล็อกออกกำลังก่อนมื้อหลังเล่นโดยอัตโนมัติ
 */
export function buildTimeline(day: ResolvedDay): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // ตื่นนอน
  entries.push({
    time: day.sleep.wake,
    minutes: toMinutes(day.sleep.wake),
    kind: "wake",
    label: "ตื่นนอน",
  });

  // มื้ออาหาร
  for (const meal of day.meals) {
    entries.push({
      time: meal.time,
      minutes: toMinutes(meal.time),
      kind: "meal",
      meal,
    });
  }

  // บล็อกออกกำลัง (เฉพาะวันที่มี workout)
  if (day.workout) {
    entries.push({
      time: day.workout.time.start,
      minutes: toMinutes(day.workout.time.start),
      kind: "workout",
      label: day.title,
      workout: day.workout,
    });
  }

  // ผ่อนคลายก่อนนอน (30 นาทีก่อนเข้านอน)
  const windDownTime = subtractMinutes(day.sleep.bedtime, 30);
  entries.push({
    time: windDownTime,
    minutes: toMinutes(windDownTime),
    kind: "winddown",
    label: "ผ่อนคลายก่อนนอน",
  });

  // เข้านอน
  entries.push({
    time: day.sleep.bedtime,
    minutes: toMinutes(day.sleep.bedtime),
    kind: "bedtime",
    label: "เข้านอน",
  });

  // เรียงตามเวลา (Array.prototype.sort เสถียรใน engine สมัยใหม่)
  return entries.sort((a, b) => a.minutes - b.minutes);
}
