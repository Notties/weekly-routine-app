import type { ISODate } from "@/data/types";

/** sparkline น้ำหนัก (SVG, ไม่ใช้ไลบรารีนอก) */
export function WeightTrend({
  series,
}: {
  series: { date: ISODate; kg: number }[];
}) {
  if (series.length < 2) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        บันทึกน้ำหนักอย่างน้อย 2 วันเพื่อดูเทรนด์
      </p>
    );
  }
  const w = 300;
  const h = 80;
  const pad = 6;
  const kgs = series.map((s) => s.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const range = max - min || 1;
  const n = series.length;
  const x = (i: number) => pad + (i / (n - 1)) * (w - 2 * pad);
  const y = (kg: number) => pad + (1 - (kg - min) / range) * (h - 2 * pad);
  const points = series.map((s, i) => `${x(i)},${y(s.kg)}`).join(" ");
  const first = series[0];
  const last = series[n - 1];
  const delta = Math.round((last.kg - first.kg) * 10) / 10;

  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full text-primary"
        preserveAspectRatio="none"
        role="img"
        aria-label="กราฟแนวโน้มน้ำหนัก"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {series.map((s, i) => (
          <circle key={i} cx={x(i)} cy={y(s.kg)} r={2} className="fill-primary" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground tnum">
        <span>{first.kg} กก.</span>
        <span
          className={
            delta < 0 ? "text-primary" : delta > 0 ? "text-amber-500" : ""
          }
        >
          {delta > 0 ? "+" : ""}
          {delta} กก.
        </span>
        <span>{last.kg} กก.</span>
      </div>
    </div>
  );
}
