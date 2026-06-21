"use client";

import * as React from "react";
import type { DayLog, ISODate } from "@/data/types";
import type { HeatCell } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function thaiShort(iso: ISODate): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]}`;
}

function cellClass(pct: number | null): string {
  if (pct === null) return "bg-muted/40";
  if (pct >= 80) return "bg-primary";
  if (pct >= 50) return "bg-primary/60";
  if (pct > 0) return "bg-primary/30";
  return "bg-muted";
}

export function AdherenceHeatmap({
  cells,
  log,
  todayISO,
}: {
  cells: HeatCell[];
  log: Record<ISODate, DayLog>;
  todayISO: string;
}) {
  const [selected, setSelected] = React.useState<ISODate | null>(null);
  const sel = selected ? cells.find((c) => c.date === selected) : null;
  const selWeight = selected ? log[selected]?.weightKg : undefined;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c) => (
          <button
            key={c.date}
            type="button"
            disabled={c.pct === null}
            onClick={() => setSelected(c.date)}
            aria-label={`${thaiShort(c.date)} ${c.pct ?? "-"}%`}
            className={cn(
              "aspect-square rounded-[3px]",
              cellClass(c.pct),
              c.date === todayISO &&
                "ring-2 ring-foreground ring-offset-1 ring-offset-background",
              selected === c.date && "ring-2 ring-primary"
            )}
          />
        ))}
      </div>

      {sel && sel.pct !== null && (
        <p className="mt-3 text-xs text-muted-foreground tnum">
          {thaiShort(sel.date)} ·{" "}
          <span className="font-semibold text-foreground">{sel.pct}%</span>
          {selWeight != null && <> · น้ำหนัก {selWeight} กก.</>}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>น้อย</span>
        <span className="size-2.5 rounded-[2px] bg-muted" />
        <span className="size-2.5 rounded-[2px] bg-primary/30" />
        <span className="size-2.5 rounded-[2px] bg-primary/60" />
        <span className="size-2.5 rounded-[2px] bg-primary" />
        <span>มาก</span>
      </div>
    </div>
  );
}
