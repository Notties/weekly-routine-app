import { Sunrise, Moon, UtensilsCrossed, Dumbbell, HeartPulse, Wind, Snowflake } from "lucide-react";
import type { DayType } from "@/data/types";
import type { TimelineEntry } from "@/lib/timeline";

/** เลือกไอคอนตามชนิดของ entry ในไทม์ไลน์ */
export function entryIcon(entry: TimelineEntry, dayType: DayType) {
  switch (entry.kind) {
    case "wake":
      return Sunrise;
    case "bedtime":
      return Moon;
    case "winddown":
      return Wind;
    case "prep":
      return Snowflake;
    case "meal":
      return UtensilsCrossed;
    case "workout":
      return dayType === "cardio" ? HeartPulse : Dumbbell;
  }
}
