import * as React from "react";
import { Dumbbell, HeartPulse, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayType } from "@/data/types";

type DayTypeInfo = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export function dayTypeInfo(type: DayType): DayTypeInfo {
  switch (type) {
    case "weights":
      return { label: "เล่นเวต", Icon: Dumbbell };
    case "cardio":
      return { label: "คาร์ดิโอ", Icon: HeartPulse };
    case "rest":
      return { label: "วันพัก", Icon: Moon };
  }
}

/** ป้ายประเภทวันแบบ outline (ขาว-ดำ) */
export function DayTypeBadge({
  type,
  className,
}: {
  type: DayType;
  className?: string;
}) {
  const { label, Icon } = dayTypeInfo(type);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
