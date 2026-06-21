import type { DayLog, ISODate, SetEntry } from "@/data/types";

// ───────────────────────────────────────────────────────────
// ตรรกะฝั่งออกกำลัง: parse ค่าพัก/ช่วง rep + progression (double progression)
// แยก pure function ไว้ที่นี่ทั้งหมด (มีเทสต์ workout.test.ts)
// ───────────────────────────────────────────────────────────

/** "120 วิ" → 120 ; รูปแบบอื่น ("-", "คาบในเซ็ต", "35 นาที…") → null */
export function parseRestSeconds(rest: string): number | null {
  const m = rest.trim().match(/^(\d+)\s*วิ$/);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 ? n : null;
}

/** ช่วง rep จาก reps string: "6–8"/"8-10" → {low,high}; "8" → {8,8}; อื่น ๆ → null */
export function parseRepRange(
  reps: string
): { low: number; high: number } | null {
  const range = reps.match(/^\s*(\d+)\s*[–-]\s*(\d+)\s*$/);
  if (range) return { low: Number(range[1]), high: Number(range[2]) };
  const single = reps.match(/^\s*(\d+)\s*$/);
  if (single) return { low: Number(single[1]), high: Number(single[1]) };
  return null;
}

/** เซ็ตที่บันทึกล่าสุดของท่า "ก่อน" วัน beforeISO (เฉพาะเซ็ตที่ reps>0) */
export function lastLift(
  log: Record<ISODate, DayLog>,
  exercise: string,
  beforeISO: ISODate
): { date: ISODate; sets: SetEntry[] } | null {
  const candidates = Object.entries(log)
    .filter(
      ([date, d]) =>
        date < beforeISO && (d.lifts?.[exercise]?.some((s) => s.reps > 0) ?? false)
    )
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)); // ใหม่→เก่า
  if (!candidates.length) return null;
  const [date, d] = candidates[0];
  return { date, sets: d.lifts![exercise].filter((s) => s.reps > 0) };
}

export type ProgressionSuggestion = {
  kind: "increase" | "hold" | "none";
  text: string;
  targetKg?: number;
};

/**
 * double progression: ดูเซ็ตที่ "น้ำหนักสูงสุด" ของครั้งก่อน
 *  - ทุกเซ็ตทำครบช่วงบน (high) → เพิ่มน้ำหนัก step กก. เริ่มที่ช่วงล่างใหม่
 *  - ยังไม่ครบ → คงน้ำหนักเดิม ดันจำนวนครั้งให้ถึงก่อน
 */
export function suggestProgression(
  reps: string,
  last: { sets: SetEntry[] } | null,
  step = 2.5
): ProgressionSuggestion {
  const range = parseRepRange(reps);
  if (!last || !last.sets.length || !range) {
    return { kind: "none", text: "บันทึกครั้งนี้ไว้ ครั้งหน้าจะเทียบให้" };
  }
  const topKg = Math.max(...last.sets.map((s) => s.kg));
  const working = last.sets.filter((s) => s.kg === topKg);
  const allHitTop = working.every((s) => s.reps >= range.high);
  if (allHitTop) {
    const targetKg = Math.round((topKg + step) * 100) / 100;
    return {
      kind: "increase",
      targetKg,
      text: `ครั้งก่อนครบ ${range.high} ครั้งทุกเซ็ตที่ ${topKg} กก. → ลองเพิ่มเป็น ${targetKg} กก. เริ่มที่ ${range.low} ครั้ง`,
    };
  }
  return {
    kind: "hold",
    text: `คงน้ำหนัก ${topKg} กก. แล้วดันให้ครบ ${range.high} ครั้งทุกเซ็ตก่อนค่อยเพิ่ม`,
  };
}
