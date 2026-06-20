"use client";

import { week } from "@/data";
import type { DayKey } from "@/data/types";
import { dayTypeInfo } from "@/components/day-type-badge";
import { cn } from "@/lib/utils";

export function DayPicker({
  selected,
  onSelect,
}: {
  selected: DayKey;
  onSelect: (key: DayKey) => void;
}) {
  return (
    <nav
      aria-label="เลือกวัน"
      className="border-b border-border"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-7 gap-1 px-2 py-2">
        {week.map((day) => {
          const active = day.key === selected;
          const { Icon, label } = dayTypeInfo(day.type);
          return (
            <button
              key={day.key}
              type="button"
              aria-pressed={active}
              aria-label={`${day.label} — ${label}`}
              onClick={() => onSelect(day.key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border py-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="text-sm font-semibold leading-none">
                {day.short}
              </span>
              <Icon className="size-3.5" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
