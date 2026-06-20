import { Moon, Sunrise, Lightbulb, Clock } from "lucide-react";
import type { ResolvedDay } from "@/data/types";
import { sleepTips } from "@/data";
import { SectionTitle } from "@/components/blocks";

export function SleepView({ day }: { day: ResolvedDay }) {
  const { sleep } = day;

  return (
    <div className="space-y-6 px-4 py-4">
      {/* การ์ดสรุปการนอน */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-3 divide-x divide-border text-center">
          <div className="px-2">
            <Moon className="mx-auto size-5 text-muted-foreground" />
            <p className="tnum mt-1.5 text-lg font-bold">{sleep.bedtime}</p>
            <p className="text-xs text-muted-foreground">เข้านอน</p>
          </div>
          <div className="px-2">
            <Sunrise className="mx-auto size-5 text-muted-foreground" />
            <p className="tnum mt-1.5 text-lg font-bold">{sleep.wake}</p>
            <p className="text-xs text-muted-foreground">ตื่นนอน</p>
          </div>
          <div className="px-2">
            <Clock className="mx-auto size-5 text-muted-foreground" />
            <p className="tnum mt-1.5 text-lg font-bold">
              {sleep.hours}
              <span className="ml-0.5 text-sm font-medium">ชม.</span>
            </p>
            <p className="text-xs text-muted-foreground">นอนรวม</p>
          </div>
        </div>

        {sleep.note && (
          <p className="mt-4 rounded-xl border border-border bg-muted p-3 text-sm leading-snug text-muted-foreground">
            {sleep.note}
          </p>
        )}
      </div>

      {/* ทิปการนอน */}
      <section>
        <SectionTitle icon={<Lightbulb className="size-4" />}>
          ทิปการนอน
        </SectionTitle>
        <ul className="mt-2 space-y-2">
          {sleepTips.map((tip, i) => (
            <li
              key={i}
              className="flex gap-2.5 rounded-xl border border-border bg-card p-3 text-sm"
            >
              <span className="tnum inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold">
                {i + 1}
              </span>
              <span className="leading-snug text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
