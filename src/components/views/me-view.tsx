"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { profile, week } from "@/data";
import { useAppStore } from "@/lib/store";
import {
  effectiveProfile,
  weightSeries,
  dayAdherence,
  computeStreak,
  daysHitInLast,
  dayKeyForDate,
  adherenceHistory,
  WATER_TARGET_ML,
} from "@/lib/tracking";
import { AdherenceHeatmap } from "@/components/adherence-heatmap";
import { dailyTarget } from "@/lib/nutrition";
import { WeightTrend } from "@/components/weight-trend";
import { NutritionStrip } from "@/components/nutrition-strip";
import { Button } from "@/components/ui/button";

const DAY_TYPE_LABEL: Record<string, string> = {
  weights: "เล่นเวต",
  cardio: "คาร์ดิโอ",
  rest: "พัก",
};

export function MeView({
  todayISO,
  onBack,
}: {
  todayISO: string;
  onBack: () => void;
}) {
  const log = useAppStore((s) => s.log);
  const profileOverride = useAppStore((s) => s.profileOverride);
  const logWeight = useAppStore((s) => s.logWeight);
  const setProfileField = useAppStore((s) => s.setProfileField);

  const eff = effectiveProfile(profile, profileOverride, log);
  const series = weightSeries(log);
  const todayDay =
    week.find((d) => d.key === dayKeyForDate(todayISO)) ?? week[0];
  const adh = dayAdherence(todayDay, log[todayISO], WATER_TARGET_ML);
  const streak = computeStreak(log, week, todayISO);
  const hit7 = daysHitInLast(log, week, todayISO, 7);
  const heat = adherenceHistory(log, week, todayISO, 8);
  const target = dailyTarget(eff, todayDay.type);

  const [weightInput, setWeightInput] = React.useState<string>(
    log[todayISO]?.weightKg != null ? String(log[todayISO]?.weightKg) : ""
  );

  const saveWeight = () => {
    const kg = parseFloat(weightInput);
    if (!Number.isNaN(kg) && kg > 0) logWeight(todayISO, kg);
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-primary"
      >
        <ChevronLeft className="size-4" />
        กลับ
      </button>

      {/* น้ำหนัก */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">น้ำหนัก</h3>
        <p className="mt-1 text-xs text-muted-foreground tnum">
          ปัจจุบัน {eff.weightKg} กก.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="น้ำหนักวันนี้ (กก.)"
            className="tnum w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <Button onClick={saveWeight} size="sm">
            บันทึก
          </Button>
        </div>
        <WeightTrend series={series} />
      </section>

      {/* ความสม่ำเสมอ */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">ความสม่ำเสมอวันนี้</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="tnum text-3xl font-bold">{adh.pct}%</span>
          <span className="text-xs text-muted-foreground tnum">
            ({adh.done}/{adh.total} อย่าง)
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${adh.pct}%` }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground tnum">
          <span>🔥 สตรีค {streak} วัน</span>
          <span>ทำครบ {hit7}/7 วันล่าสุด</span>
        </div>
      </section>

      {/* ประวัติ heatmap */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">ประวัติความสม่ำเสมอ (8 สัปดาห์)</h3>
        <div className="mt-3">
          <AdherenceHeatmap cells={heat} log={log} todayISO={todayISO} />
        </div>
      </section>

      {/* เป้าวันนี้ */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">
          เป้าวันนี้ ({DAY_TYPE_LABEL[todayDay.type]})
        </h3>
        <NutritionStrip macros={target} />
      </section>

      {/* แก้โปรไฟล์ */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">โปรไฟล์</h3>
        <div className="mt-3 space-y-3">
          <ProfileField
            label="เป้าหมาย"
            value={eff.goal}
            onCommit={(v) => setProfileField("goal", v)}
          />
          <ProfileField
            label="ส่วนสูง (ซม.)"
            type="number"
            value={String(eff.heightCm)}
            onCommit={(v) => setProfileField("heightCm", Number(v) || eff.heightCm)}
          />
          <ProfileField
            label="อายุ (ปี)"
            type="number"
            value={String(eff.age)}
            onCommit={(v) => setProfileField("age", Number(v) || eff.age)}
          />
          <ProfileField
            label="ช่วงเล่น"
            value={eff.workoutWindow}
            onCommit={(v) => setProfileField("workoutWindow", v)}
          />
        </div>
      </section>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onCommit,
  type = "text",
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        defaultValue={value}
        onBlur={(e) => onCommit(e.target.value)}
        className="tnum mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}
