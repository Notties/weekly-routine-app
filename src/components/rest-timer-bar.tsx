"use client";

import * as React from "react";
import { Timer, Plus, X } from "lucide-react";
import { useAppStore } from "@/lib/store";

/** เสียงบี๊บสั้น + สั่น เมื่อพักครบ (optional — ไม่มีก็เงียบ ไม่ throw) */
function notifyDone() {
  try {
    navigator.vibrate?.([200, 90, 200]);
  } catch {
    /* ไม่รองรับ vibrate */
  }
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.start(t);
    osc.stop(t + 0.46);
    osc.onended = () => ctx.close();
  } catch {
    /* ไม่รองรับ Web Audio */
  }
}

export function RestTimerBar() {
  const endsAt = useAppStore((s) => s.restEndsAt);
  const total = useAppStore((s) => s.restTotal);
  const addRest = useAppStore((s) => s.addRest);
  const stopRest = useAppStore((s) => s.stopRest);

  const [now, setNow] = React.useState(() => Date.now());
  const doneRef = React.useRef(false);

  // เดินนาฬิกาเฉพาะตอนมี timer (interval อัปเดต now ทุก 200ms)
  React.useEffect(() => {
    if (!endsAt) return;
    doneRef.current = false;
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endsAt]);

  // ครบเวลา → เตือน + ปิดเองใน 4 วิ
  React.useEffect(() => {
    if (!endsAt || doneRef.current) return;
    if (now >= endsAt) {
      doneRef.current = true;
      notifyDone();
      const id = setTimeout(() => stopRest(), 4000);
      return () => clearTimeout(id);
    }
  }, [now, endsAt, stopRest]);

  if (!endsAt || !total) return null;

  const remainingMs = Math.max(0, endsAt - now);
  const remaining = Math.ceil(remainingMs / 1000);
  const pct = Math.max(0, Math.min(100, (remainingMs / (total * 1000)) * 100));
  const done = remainingMs <= 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-safe">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl px-3 pb-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="h-1 w-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-200 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Timer className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              {done ? (
                <p className="text-sm font-bold">พักครบแล้ว — ลุยเซ็ตต่อ!</p>
              ) : (
                <p className="flex items-baseline gap-1.5">
                  <span className="tnum text-xl font-bold">{remaining}</span>
                  <span className="text-xs text-muted-foreground">
                    วิ เหลือ
                  </span>
                </p>
              )}
            </div>
            {!done && (
              <button
                type="button"
                onClick={() => addRest(15)}
                className="flex items-center gap-0.5 rounded-lg border border-border px-2 py-1 text-xs font-medium"
              >
                <Plus className="size-3.5" />
                15
              </button>
            )}
            <button
              type="button"
              onClick={stopRest}
              aria-label="หยุดจับเวลา"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
