import type { Macros } from "@/data/types";
import { cn } from "@/lib/utils";

/** แถบ progress 1 ตัว (value/target) */
function Bar({ value, target, warnOver }: { value: number; target: number; warnOver: boolean }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const off = warnOver ? value > target : value < target;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", off ? "bg-amber-500" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  target,
  unit,
  warnOver,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  warnOver: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tnum text-muted-foreground">
          <span className="font-semibold text-foreground">{value}</span> / {target} {unit}
        </span>
      </div>
      <div className="mt-1">
        <Bar value={value} target={target} warnOver={warnOver} />
      </div>
    </div>
  );
}

/** สรุปโภชนาการรวมของวัน เทียบเป้า (kcal + โปรตีน เป็นแถบ, C/F เป็นตัวเลข) */
export function DailyNutritionSummary({ total, target }: { total: Macros; target: Macros }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-bold">สรุปวันนี้ เทียบเป้า</h3>
      <div className="mt-3 space-y-3">
        <Row label="แคลอรี่" value={total.kcal} target={target.kcal} unit="kcal" warnOver />
        <Row label="โปรตีน" value={total.protein} target={target.protein} unit="ก." warnOver={false} />
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="tnum">
          คาร์บ <span className="font-semibold text-foreground">{total.carb}</span> / {target.carb} ก.
        </span>
        <span className="tnum">
          ไขมัน <span className="font-semibold text-foreground">{total.fat}</span> / {target.fat} ก.
        </span>
      </div>
    </div>
  );
}
