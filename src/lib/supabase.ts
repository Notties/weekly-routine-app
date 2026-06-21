import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ───────────────────────────────────────────────────────────
// Supabase client — ใช้สำหรับ "auth" (magic-link) ฝั่ง client เท่านั้น
// ข้อมูลแอปไปผ่าน /api/* (Prisma) ไม่ผ่าน client นี้แล้ว
// ไม่ตั้ง env = ปุ่มเข้าสู่ระบบจะถูกซ่อน (ดู isSyncConfigured)
// ───────────────────────────────────────────────────────────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// รองรับทั้งคีย์ใหม่ (sb_publishable_...) และ anon key เดิม
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** ตั้งค่าคลาวด์ครบหรือยัง (มี url + key) */
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
