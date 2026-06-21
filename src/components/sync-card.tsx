"use client";

import * as React from "react";
import { Cloud, CloudOff, RefreshCw, LogOut, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSyncStore,
  signIn,
  signOut,
  syncNow,
  type SyncStatus,
} from "@/lib/use-sync";

const STATUS_LABEL: Record<SyncStatus, string> = {
  offline: "ใช้งานออฟไลน์",
  idle: "พร้อมซิงค์",
  syncing: "กำลังซิงค์…",
  synced: "ซิงค์แล้ว",
  error: "ซิงค์ไม่สำเร็จ",
};

function timeAgo(ms: number | null): string {
  if (!ms) return "—";
  const diff = Math.round((Date.now() - ms) / 1000);
  if (diff < 60) return "เมื่อสักครู่";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีก่อน`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ก่อน`;
  return `${Math.floor(diff / 86400)} วันก่อน`;
}

export function SyncCard() {
  const configured = useSyncStore((s) => s.configured);
  const email = useSyncStore((s) => s.email);
  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const error = useSyncStore((s) => s.error);

  const [input, setInput] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  if (!configured) {
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
                (status === "synced"
                  ? "bg-primary/10 text-foreground"
                  : status === "error"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground")
              }
            >
              {status === "synced" && <Check className="size-3" />}
              {STATUS_LABEL[status]}
            </span>
            <span className="tnum text-muted-foreground">
              ซิงค์ล่าสุด {timeAgo(lastSyncedAt)}
            </span>
          </div>
          {error && (
            <p className="mt-1 text-xs text-destructive">{error}</p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => void syncNow()}
              disabled={status === "syncing"}
            >
              <RefreshCw className="size-3.5" />
              ซิงค์เดี๋ยวนี้
            </Button>
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
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </>
      )}
    </section>
  );
}
