import { getSupabase } from "@/lib/supabase";

// ── Error classes ──────────────────────────────────────────────────────────────
/** ข้อผิดพลาด: token หมดอายุหรือยังไม่เข้าสู่ระบบ (HTTP 401) */
export class AuthError extends Error {}
/** ข้อผิดพลาด: เครือข่ายขัดข้อง (fetch reject) */
export class NetworkError extends Error {}

// ── Helper: สร้าง Authorization header ─────────────────────────────────────────
async function authHeader(): Promise<Record<string, string>> {
  const sb = getSupabase();
  if (!sb) return {};
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Helper: รัน fetch + จัดการ error ──────────────────────────────────────────
async function run(path: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new NetworkError("เครือข่ายขัดข้อง");
  }
  if (res.status === 401) throw new AuthError("ต้องเข้าสู่ระบบ");
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** GET /path → parse JSON เป็น T; แนบ Bearer token อัตโนมัติ */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await run(path, { headers: { ...(await authHeader()) } });
  return (await res.json()) as T;
}

/** PUT/POST/DELETE /path พร้อม body JSON; แนบ Bearer token อัตโนมัติ */
export async function apiSend(
  method: "PUT" | "POST" | "DELETE",
  path: string,
  body?: unknown
): Promise<void> {
  await run(path, {
    method,
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
