"use client";

import * as React from "react";
import { Cloud, CloudOff, LogOut, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { runMigrationOnce } from "@/lib/api/run-migration";

type Mode = "login" | "signup";

export function SyncCard() {
  const [email, setEmail] = React.useState<string | null>(null);
  const [inputEmail, setInputEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("login");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
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

  const submit = async () => {
    const mail = inputEmail.trim();
    if (!mail || !password) return;
    if (password.length < 6) {
      setError("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const sb = getSupabase()!;
    if (mode === "login") {
      const { error: err } = await sb.auth.signInWithPassword({ email: mail, password });
      if (err) setError(err.message);
      // สำเร็จ → onAuthStateChange จัดการ hydrate ให้เอง
    } else {
      const { data, error: err } = await sb.auth.signUp({ email: mail, password });
      if (err) setError(err.message);
      else if (!data.session) {
        // ไม่มี session = Supabase เปิด "ยืนยันอีเมล" อยู่
        setNotice(
          "สมัครแล้ว — ถ้าระบบเปิดยืนยันอีเมล ให้ยืนยันในอีเมลก่อน (หรือปิด Confirm email ใน Supabase แล้วเข้าสู่ระบบได้เลย)"
        );
      }
      // ถ้ามี session → onAuthStateChange จัดการ hydrate ให้เอง
    }
    setBusy(false);
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
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "login"
              ? "เข้าสู่ระบบด้วยอีเมล + รหัสผ่านเพื่อใช้งานและซิงค์ข้อมูล"
              : "สมัครด้วยอีเมล + รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"}
          </p>
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
            <Button type="submit" disabled={busy} className="h-10 rounded-xl">
              {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
            onClick={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "login" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
          </button>

          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          {notice && <p className="mt-1 text-xs text-muted-foreground">{notice}</p>}
        </>
      )}
    </section>
  );
}
