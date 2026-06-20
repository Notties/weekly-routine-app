import type { Day } from "@/data/types";
import { buildTimeline } from "@/lib/timeline";
import { StepList, TagRow } from "@/components/blocks";
import { NowNextCard } from "@/components/now-next-card";
import { entryIcon } from "@/components/entry-icon";
import { cn } from "@/lib/utils";

export function TimelineView({
  day,
  isToday = false,
}: {
  day: Day;
  isToday?: boolean;
}) {
  const timeline = buildTimeline(day);

  return (
    <div className="px-4 py-4">
      {isToday && <NowNextCard day={day} />}
      <ol className="relative">
        {timeline.map((entry, i) => {
          const Icon = entryIcon(entry, day.type);
          const isLast = i === timeline.length - 1;
          const isWorkout = entry.kind === "workout";
          const emphasized =
            entry.kind === "wake" || entry.kind === "bedtime";

          return (
            <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {/* rail: จุด + เส้น */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border",
                    isWorkout
                      ? "border-primary bg-primary text-primary-foreground"
                      : emphasized
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {!isLast && (
                  <span className="w-px flex-1 bg-border" aria-hidden />
                )}
              </div>

              {/* เนื้อหา */}
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-baseline gap-2">
                  <time className="tnum text-sm font-semibold">
                    {entry.time}
                  </time>
                  <span className="truncate text-sm font-medium text-foreground">
                    {entry.kind === "meal" ? entry.meal?.name : entry.label}
                  </span>
                </div>

                {entry.kind === "meal" && entry.meal && (
                  <div className="mt-1 rounded-xl border border-border bg-card p-3">
                    <p className="text-sm font-medium">{entry.meal.menu}</p>
                    <StepList steps={entry.meal.steps} />
                    <TagRow tags={entry.meal.tags} />
                  </div>
                )}

                {entry.kind === "workout" && entry.workout && (
                  <div className="mt-1 rounded-xl border border-border bg-card p-3">
                    <p className="text-sm text-muted-foreground">
                      {entry.workout.exercises.length} ท่า ·{" "}
                      <span className="tnum">
                        {entry.workout.time.start}–{entry.workout.time.end}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ดูรายละเอียดท่าได้ที่แท็บ “ออกกำลัง”
                    </p>
                  </div>
                )}

                {(entry.kind === "wake" || entry.kind === "bedtime") && (
                  <p className="mt-0.5 text-xs text-muted-foreground tnum">
                    {entry.kind === "wake"
                      ? `นอน ${day.sleep.hours} ชม.`
                      : `ตั้งเป้าตื่น ${day.sleep.wake}`}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
