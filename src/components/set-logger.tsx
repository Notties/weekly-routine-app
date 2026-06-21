"use client";

import * as React from "react";
import { TrendingUp, Eraser } from "lucide-react";
import type { Exercise } from "@/data/types";
import { useAppStore } from "@/lib/store";
import { lastLift, suggestProgression } from "@/lib/workout";

export function SetLogger({
  exercise,
  todayISO,
}: {
  exercise: Exercise;
  todayISO: string;
}) {
  const log = useAppStore((s) => s.log);
  const logSet = useAppStore((s) => s.logSet);
  const clearLift = useAppStore((s) => s.clearLift);
  const [resetKey, setResetKey] = React.useState(0);

  const saved = log[todayISO]?.lifts?.[exercise.name] ?? [];
  const last = lastLift(log, exercise.name, todayISO);
  const sug = suggestProgression(exercise.reps, last);
  const hasData = saved.some((s) => s.reps > 0 || s.kg > 0);

  const rows = Array.from({ length: exercise.sets });

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-medium text-primary">
        บันทึกเซ็ต{hasData ? " ✓" : ""}
      </summary>

      {last && (
        <p className="mt-2 text-xs text-muted-foreground">
          ครั้งก่อน ({last.date}):{" "}
          <span className="tnum font-medium text-foreground">
            {last.sets.map((s) => `${s.kg}×${s.reps}`).join(", ")}
          </span>
        </p>
      )}

      {sug.kind !== "none" && (
        <p
          className={
            "mt-1.5 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs leading-snug " +
            (sug.kind === "increase"
              ? "bg-primary/10 font-medium text-foreground"
              : "text-muted-foreground")
          }
        >
          <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{sug.text}</span>
        </p>
      )}

      <div className="mt-2 space-y-1.5">
        {rows.map((_, i) => (
          <SetRow
            key={`${resetKey}-${i}`}
            index={i}
            initialKg={saved[i]?.kg}
            initialReps={saved[i]?.reps}
            onCommit={(kg, reps) => logSet(todayISO, exercise.name, i, kg, reps)}
          />
        ))}
      </div>

      {hasData && (
        <button
          type="button"
          onClick={() => {
            clearLift(todayISO, exercise.name);
            setResetKey((k) => k + 1);
          }}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground"
        >
          <Eraser className="size-3.5" />
          ล้างที่บันทึก
        </button>
      )}
    </details>
  );
}

function SetRow({
  index,
  initialKg,
  initialReps,
  onCommit,
}: {
  index: number;
  initialKg?: number;
  initialReps?: number;
  onCommit: (kg: number, reps: number) => void;
}) {
  const [kg, setKg] = React.useState(initialKg ? String(initialKg) : "");
  const [reps, setReps] = React.useState(initialReps ? String(initialReps) : "");

  const commit = () => onCommit(parseFloat(kg) || 0, parseInt(reps, 10) || 0);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 shrink-0 text-muted-foreground">เซ็ต {index + 1}</span>
      <input
        type="number"
        inputMode="decimal"
        value={kg}
        onChange={(e) => setKg(e.target.value)}
        onBlur={commit}
        placeholder="กก."
        className="tnum w-full rounded-lg border border-border bg-background px-2 py-1.5"
      />
      <span className="text-muted-foreground">×</span>
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        placeholder="ครั้ง"
        className="tnum w-full rounded-lg border border-border bg-background px-2 py-1.5"
      />
    </div>
  );
}
