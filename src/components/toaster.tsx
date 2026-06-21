"use client";

import { Check, AlertCircle } from "lucide-react";
import { useToast } from "@/lib/toast";

/** Toaster — แสดง toast ลอยกลางล่างจอ (ไม่ใช้ไลบรารีนอก) */
export function Toaster() {
  const toasts = useToast((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={
            "pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 " +
            (t.type === "error"
              ? "bg-destructive text-white"
              : "bg-foreground text-background")
          }
        >
          {t.type === "error" ? (
            <AlertCircle className="size-4 shrink-0" />
          ) : (
            <Check className="size-4 shrink-0" />
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
