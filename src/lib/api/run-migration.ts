import { apiSend } from "@/lib/api/client";
import { useAppStore } from "@/lib/store";

const LEGACY_KEY = "knot-gym";
const MIGRATED_FLAG = "knot-gym-migrated";

/**
 * ย้ายข้อมูล localStorage เดิม (zustand persist) ขึ้น backend ครั้งเดียว
 * เรียกหลัง login สำเร็จ — idempotent ด้วย flag
 */
export async function runMigrationOnce(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_FLAG)) return;
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_FLAG, "1");
    return;
  }
  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    const s = parsed.state ?? {};
    const slice = {
      swaps: s.swaps ?? {},
      checked: s.checked ?? {},
      log: s.log ?? {},
      profileOverride: s.profileOverride ?? {},
    };
    await apiSend("POST", "/api/migrate", slice);
    localStorage.setItem(MIGRATED_FLAG, "1");
  } catch {
    // flag ยังไม่ตั้ง → ลองใหม่ครั้งหน้า; แจ้งผู้ใช้ผ่าน syncError
    useAppStore.setState({ syncError: "ย้ายข้อมูลเดิมไม่สำเร็จ — จะลองใหม่ครั้งหน้า" });
  }
}
