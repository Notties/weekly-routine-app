"use client";

import { User, WifiOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSessionEmail, initialsFromEmail } from "@/lib/use-session";
import { useAppStore } from "@/lib/store";

export function ProfileHeader({ onOpen }: { onOpen?: () => void }) {
  const email = useSessionEmail();
  const initials = email ? initialsFromEmail(email) : null;
  const online = useAppStore((s) => s.online);

  return (
    <header className="border-b border-border pt-safe">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <h1 className="truncate text-base font-bold tracking-tight">Knot</h1>
        <div className="flex items-center gap-1.5">
          {!online && (
            <span
              className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-medium text-amber-600 dark:text-amber-500"
              title="ออฟไลน์ — การแก้ไขจะยังไม่ถูกบันทึก"
            >
              <WifiOff className="size-3" />
              ออฟไลน์
            </span>
          )}
          <button
            type="button"
            onClick={onOpen}
            aria-label="โปรไฟล์"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            {initials ?? <User className="size-4" />}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
