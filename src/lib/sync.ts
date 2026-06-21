import type { DayLog, ISODate, ProfileOverride } from "@/data/types";

// ───────────────────────────────────────────────────────────
// ตรรกะ merge สำหรับ cloud sync (offline-first, union + last-write-wins)
// pure ทั้งหมด (มีเทสต์ sync.test.ts) — ไม่แตะ network/Supabase ที่นี่
// ───────────────────────────────────────────────────────────

/** ส่วนของ state ที่ sync ขึ้นคลาวด์ (UI-local เช่น selectedDay ไม่ sync) */
export type SyncSlice = {
  swaps: Record<string, string>;
  checked: Record<string, boolean>;
  log: Record<ISODate, DayLog>;
  profileOverride: ProfileOverride;
};

/** envelope ที่เก็บใน Supabase (data + เวลาที่อัปเดตล่าสุด ms) */
export type SyncEnvelope = { data: SyncSlice; updatedAt: number };

/** merge log ของวันเดียว: union meals/lifts, ฟิลด์อื่นฝั่ง "ใหม่" (b) ชนะ */
function mergeDay(older: DayLog, newer: DayLog): DayLog {
  const merged: DayLog = { ...older, ...newer };
  if (older.meals || newer.meals) {
    merged.meals = { ...(older.meals ?? {}), ...(newer.meals ?? {}) };
  }
  if (older.lifts || newer.lifts) {
    merged.lifts = { ...(older.lifts ?? {}), ...(newer.lifts ?? {}) };
  }
  return merged;
}

function mergeLogs(
  older: Record<ISODate, DayLog>,
  newer: Record<ISODate, DayLog>
): Record<ISODate, DayLog> {
  const out: Record<ISODate, DayLog> = { ...older };
  for (const [date, day] of Object.entries(newer)) {
    out[date] = out[date] ? mergeDay(out[date], day) : day;
  }
  return out;
}

/**
 * รวม state สองฝั่งแบบ union (ไม่ทำของฝั่งใดหาย); key ที่ชนกัน → ฝั่งที่ "ใหม่กว่า" ชนะ
 * @param localNewer true ถ้า local ถูกแก้หลัง remote.updatedAt
 */
export function mergeSlice(
  local: SyncSlice,
  remote: SyncSlice,
  localNewer: boolean
): SyncSlice {
  const older = localNewer ? remote : local;
  const newer = localNewer ? local : remote;
  return {
    swaps: { ...older.swaps, ...newer.swaps },
    checked: { ...older.checked, ...newer.checked },
    profileOverride: { ...older.profileOverride, ...newer.profileOverride },
    log: mergeLogs(older.log, newer.log),
  };
}

/** ดึงเฉพาะ slice ที่ sync จาก state ก้อนใหญ่ */
export function pickSyncSlice(s: SyncSlice): SyncSlice {
  return {
    swaps: s.swaps ?? {},
    checked: s.checked ?? {},
    log: s.log ?? {},
    profileOverride: s.profileOverride ?? {},
  };
}
