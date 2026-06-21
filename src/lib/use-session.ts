"use client";

import * as React from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * อ่านอีเมลของผู้ใช้ที่ล็อกอินอยู่ (read-only) — ใช้โชว์ตัวตนใน UI
 * แยกจาก SyncCard (ที่ถือ logic login/migration) เพื่อไม่ไปยุ่งกัน
 */
export function useSessionEmail(): string | null {
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth
      .getSession()
      .then(({ data }) => setEmail(data.session?.user?.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return email;
}

/** อักษรย่อจากอีเมล เช่น "akthakorn.t@x" → "AT", "joe@x" → "JO" */
export function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[.\-_+]+/).filter(Boolean);
  const ini =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
  return ini.toUpperCase() || "?";
}
