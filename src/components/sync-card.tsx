"use client";

import * as React from "react";
import { Cloud, CloudOff, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";

// ───────────────────────────────────────────────────────────
// SyncCard — แสดงสถานะ auth + online/syncError จาก store ใหม่
// ───────────────────────────────────────────────────────────

/** ส่ง magic-link เข้าอีเมล — คืน true ถ้าส่งสำเร็จ */
async function signIn(email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  return !error;
}

async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export function SyncCard() {
  const online = useAppStore((s) => s.online);
  const syncError = useAppStore((s) => s.syncError);

  const [email, setEmail] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // ฟังสถานะ auth session (ครั้งแรก + เปลี่ยน)
  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSyncConfigured) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <CloudOff className="size-4" />
          ซิงค์คลาวด์
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          ยังไม่ได้ตั้งค่าคลาวด์ — ข้อมูลเก็บในเครื่องนี้เท่านั้น (ใช้งานได้ปกติ)
        </p>
      </section>
    );
  }

  const send = async () => {
    const e = input.trim();
    if (!e) return;
    setBusy(true);
    const ok = await signIn(e);
    setBusy(false);
    if (ok) setSent(true);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Cloud className="size-4" />
        ซิงค์คลาวด์
      </h3>

      {email ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            เข้าระบบเป็น <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium " +
                (!online
                  ? "bg-destructive/10 text-destructive"
                  : syncError
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-foreground")
              }
            >
              {!online ? "ออฟไลน์" : syncError ? "ซิงค์ไม่สำเร็จ" : "พร้อมใช้งาน"}
            </span>
          </div>
          {syncError && (
            <p className="mt-1 text-xs text-destructive">{syncError}</p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground"
              onClick={() => void signOut()}
            >
              <LogOut className="size-3.5" />
              ออกจากระบบ
            </Button>
          </div>
        </>
      ) : sent ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-primary/10 px-2 py-2 text-xs leading-snug">
          <Mail className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            ส่งลิงก์เข้าระบบไปที่อีเมลแล้ว — เปิดลิงก์บนเครื่องนี้เพื่อเข้าระบบ
          </span>
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            เข้าระบบด้วยอีเมลเพื่อซิงค์ข้อมูลข้ามอุปกรณ์ (ส่งลิงก์เข้าอีเมล ไม่มีรหัสผ่าน)
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <Button size="sm" onClick={() => void send()} disabled={busy}>
              ส่งลิงก์
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
