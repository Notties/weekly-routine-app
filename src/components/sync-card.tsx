"use client";

import * as React from "react";
import { Cloud, CloudOff, LogOut, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { runMigrationOnce } from "@/lib/api/run-migration";

export function SyncCard() {
  const [email, setEmail] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const syncError = useAppStore((s) => s.syncError);

  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        void runMigrationOnce().then(() => useAppStore.getState().hydrate());
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSyncConfigured) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <CloudOff className="size-4" />
          เข้าสู่ระบบ
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          ยังไม่ได้ตั้งค่าคลาวด์ — แอปนี้ต้องตั้งค่า Supabase จึงจะใช้งานได้
        </p>
      </section>
    );
  }

  const send = async () => {
    const e = input.trim();
    if (!e) return;
    setBusy(true);
    setError(null);
    const sb = getSupabase()!;
    const { error: err } = await sb.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  const signOut = async () => {
    await getSupabase()?.auth.signOut();
    setEmail(null);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Cloud className="size-4" />
        เข้าสู่ระบบ
      </h3>

      {email ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            เข้าระบบเป็น <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-foreground">
              <Check className="size-3" />
              {syncError ? syncError : "ข้อมูลซิงค์อัตโนมัติ"}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => void signOut()}>
              <LogOut className="size-3.5" />
              ออกจากระบบ
            </Button>
          </div>
        </>
      ) : sent ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-primary/10 px-2 py-2 text-xs leading-snug">
          <Mail className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>ส่งลิงก์เข้าระบบไปที่อีเมลแล้ว — เปิดลิงก์บนเครื่องนี้เพื่อเข้าระบบ</span>
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            เข้าระบบด้วยอีเมลเพื่อใช้งานและซิงค์ข้อมูล (ส่งลิงก์เข้าอีเมล ไม่มีรหัสผ่าน)
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="email" inputMode="email" autoComplete="email"
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <Button size="sm" onClick={() => void send()} disabled={busy}>ส่งลิงก์</Button>
          </div>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </>
      )}
    </section>
  );
}
