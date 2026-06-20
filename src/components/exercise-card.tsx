import type { Exercise } from "@/data/types";

export function ExerciseCard({
  exercise,
  index,
}: {
  exercise: Exercise;
  index: number;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <span className="tnum mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{exercise.name}</p>
        <p className="text-xs text-muted-foreground">{exercise.muscle}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">
            เซ็ต ×{" "}
            <span className="tnum font-semibold text-foreground">
              {exercise.sets}
            </span>
          </span>
          <span className="text-muted-foreground">
            ครั้ง{" "}
            <span className="tnum font-semibold text-foreground">
              {exercise.reps}
            </span>
          </span>
          <span className="text-muted-foreground">
            พัก{" "}
            <span className="tnum font-semibold text-foreground">
              {exercise.rest}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
