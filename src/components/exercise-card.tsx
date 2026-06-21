import type { Exercise } from "@/data/types";
import { exerciseCues } from "@/data";

export function ExerciseCard({
  exercise,
  index,
}: {
  exercise: Exercise;
  index: number;
}) {
  const cues = exerciseCues[exercise.name];

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
        {cues && cues.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-primary">
              ดูฟอร์ม
            </summary>
            <ul className="mt-1.5 space-y-1">
              {cues.map((c, i) => (
                <li
                  key={i}
                  className="flex gap-1.5 text-xs leading-snug text-muted-foreground"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
