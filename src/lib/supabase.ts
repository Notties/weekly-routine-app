import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ───────────────────────────────────────────────────────────
// Supabase client (null-safe) — ไม่ตั้ง env = sync ปิด แอปทำงานออฟไลน์ปกติ
// env inlined ตอน build (static export): NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY
// ───────────────────────────────────────────────────────────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** ตั้งค่าคลาวด์ครบหรือยัง (มี url + anon key) */
export const isSyncConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** คืน client เดียวกันทุกครั้ง; ถ้าไม่ได้ตั้ง env → null */
export function getSupabase(): SupabaseClient | null {
  if (!isSyncConfigured) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

/** ชื่อตารางที่เก็บ state ก้อนเดียวต่อผู้ใช้ */
export const STATE_TABLE = "user_state";
