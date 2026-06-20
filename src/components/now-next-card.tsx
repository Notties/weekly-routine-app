"use client";

import * as React from "react";
import { Moon, ArrowRight } from "lucide-react";
import type { Day } from "@/data/types";
import { buildTimeline, type TimelineEntry } from "@/lib/timeline";
import { entryIcon } from "@/components/entry-icon";

function entryName(entry: TimelineEntry): string {
  if (entry.kind === "meal") return entry.meal?.name ?? "มื้ออาหาร";
  return entry.label ?? "";
}

export function NowNextCard({ day }: { day: Day }) {
  const [nowMin, setNowMin] = React.useState<number | null>(null);

  // อัปเดตเวลาปัจจุบันทุกนาที (หลัง mount เพื่อเลี่ยง hydration mismatch)
  React.useEffect(() => {
    const update = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (nowMin === null) return null;

  const timeline = buildTimeline(day);
  let current: TimelineEntry | null = null;
  let next: TimelineEntry | null = null;
  for (const entry of timeline) {
    if (entry.minutes <= nowMin) current = entry;
    else {
      next = entry;
      break;
    }
  }

  const CurrentIcon = current ? entryIcon(current, day.type) : Moon;
  const NextIcon = next ? entryIcon(next, day.type) : Moon;

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card">
      {/* ตอนนี้ — เน้นด้วยสี primary */}
      <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
        <CurrentIcon className="size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider opacity-80">
            ตอนนี้
          </p>
          <p className="truncate text-sm font-semibold">
            {current ? entryName(current) : "ยังไม่ถึงเวลาตื่น"}
          </p>
        </div>
        {current && (
          <time className="tnum text-sm font-semibold">{current.time}</time>
        )}
      </div>

      {/* ถัดไป */}
      <div className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground">
        <ArrowRight className="size-4 shrink-0" />
        <NextIcon className="size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium uppercase tracking-wider">
            ถัดไป{" · "}
          </span>
          <span className="text-sm font-medium text-foreground">
            {next ? entryName(next) : "หมดกิจกรรมของวันนี้แล้ว"}
          </span>
        </div>
        {next && (
          <time className="tnum text-sm font-semibold text-foreground">
            {next.time}
          </time>
        )}
      </div>
    </div>
  );
}
