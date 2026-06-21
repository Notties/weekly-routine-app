"use client";

import { User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSessionEmail, initialsFromEmail } from "@/lib/use-session";

export function ProfileHeader({ onOpen }: { onOpen?: () => void }) {
  const email = useSessionEmail();
  const initials = email ? initialsFromEmail(email) : null;

  return (
    <header className="border-b border-border pt-safe">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <h1 className="truncate text-base font-bold tracking-tight">Knot</h1>
        <div className="flex items-center gap-1.5">
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
