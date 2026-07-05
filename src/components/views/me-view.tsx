"use client";

import * as React from "react";
import {
  ChevronLeft,
  User,
  Scale,
  Flame,
  CalendarCheck,
  Target,
  Activity,
  Pencil,
  TrendingDown,
  TrendingUp,
  Dumbbell,
} from "lucide-react";
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
import { useSessionEmail, initialsFromEmail } from "@/lib/use-session";
import { toast } from "@/lib/toast";
import { dailyTarget } from "@/lib/nutrition";
import { personalRecords } from "@/lib/workout";
import { WeightTrend } from "@/components/weight-trend";
import { NutritionStrip } from "@/components/nutrition-strip";
import { SyncCard } from "@/components/sync-card";
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
  const sessionEmail = useSessionEmail();
  const displayName = sessionEmail ? sessionEmail.split("@")[0] : "โปรไฟล์ของฉัน";
  const initials = sessionEmail ? initialsFromEmail(sessionEmail) : null;

  const eff = effectiveProfile(profile, profileOverride, log);
  const series = weightSeries(log);
  const hasLog = Object.keys(log).length > 0;
  const weightDelta =
    series.length >= 2
      ? Math.round((series[series.length - 1].kg - series[0].kg) * 10) / 10
      : null;
  const todayDay =
    week.find((d) => d.key === dayKeyForDate(todayISO)) ?? week[0];
  const adh = dayAdherence(todayDay, log[todayISO], WATER_TARGET_ML);
  const streak = computeStreak(log, week, todayISO);
  const hit7 = daysHitInLast(log, week, todayISO, 7);
  const heat = adherenceHistory(log, week, todayISO, 8);
  const target = dailyTarget(eff, todayDay.type);
  const prs = personalRecords(log);

  const [weightInput, setWeightInput] = React.useState<string>(
    log[todayISO]?.weightKg != null ? String(log[todayISO]?.weightKg) : ""
  );

  const saveWeight = () => {
    const kg = parseFloat(weightInput);
    if (!Number.isNaN(kg) && kg > 0) {
      logWeight(todayISO, kg);
      toast.success("บันทึกน้ำหนักแล้ว");
    }
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 flex items-center gap-1 text-sm font-medium text-primary"
      >
        <ChevronLeft className="size-4" />
        กลับ
      </button>

      {/* ───── Hero: ตัวตน + สถิติเด่น ───── */}
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
            {initials ? (
              <span className="text-lg font-bold tracking-wide">{initials}</span>
            ) : (
              <User className="size-7" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold leading-tight">{displayName}</h2>
            {sessionEmail && (
              <p className="truncate text-xs text-muted-foreground">{sessionEmail}</p>
            )}
            <p className="mt-0.5 truncate text-xs text-muted-foreground tnum">
              {eff.sex} · {eff.age} ปี · {eff.goal}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat icon={<Scale className="size-3.5" />} label="น้ำหนัก" value={`${eff.weightKg}`} unit="กก." />
          <Stat icon={<Flame className="size-3.5" />} label="สตรีค" value={`${streak}`} unit="วัน" />
          <Stat icon={<CalendarCheck className="size-3.5" />} label="7 วันล่าสุด" value={`${hit7}/7`} unit="วัน" />
        </div>
      </section>

      {/* ───── ความสม่ำเสมอวันนี้ (วงแหวน) ───── */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Activity className="size-4 text-primary" />
          ความสม่ำเสมอวันนี้
        </h3>
        <div className="mt-3 flex items-center gap-4">
          <ProgressRing pct={adh.pct} />
          <div className="min-w-0 flex-1 space-y-1.5 text-xs text-muted-foreground tnum">
            <p>
              ทำได้{" "}
              <span className="font-semibold text-foreground">
                {adh.done}/{adh.total}
              </span>{" "}
              อย่างวันนี้
            </p>
            <p className="flex items-center gap-1.5">
              <Flame className="size-3.5 text-amber-500" />
              สตรีค {streak} วัน
            </p>
            <p className="flex items-center gap-1.5">
              <CalendarCheck className="size-3.5 text-primary" />
              ทำครบ {hit7}/7 วันล่าสุด
            </p>
          </div>
        </div>
      </section>

      {/* ───── น้ำหนัก ───── */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Scale className="size-4 text-primary" />
          น้ำหนัก
          <span className="ml-auto text-xs font-normal text-muted-foreground tnum">
            ปัจจุบัน {eff.weightKg} กก.
          </span>
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="น้ำหนักวันนี้ (กก.)"
            aria-label="น้ำหนักวันนี้ (กก.)"
            className="tnum h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          <Button onClick={saveWeight} className="h-10 shrink-0 rounded-xl px-5">
            บันทึก
          </Button>
        </div>
        {weightDelta != null && weightDelta !== 0 && (
          <p
            className={
              "mt-3 flex items-center gap-1.5 text-xs font-medium " +
              (weightDelta < 0 ? "text-primary" : "text-amber-500")
            }
          >
            {weightDelta < 0 ? (
              <TrendingDown className="size-3.5" />
            ) : (
              <TrendingUp className="size-3.5" />
            )}
            {weightDelta < 0
              ? `ลดมา ${Math.abs(weightDelta)} กก.`
              : `เพิ่มมา ${weightDelta} กก.`}{" "}
            <span className="font-normal text-muted-foreground">จากที่เริ่มบันทึก</span>
          </p>
        )}
        <WeightTrend series={series} />
      </section>

      {/* ───── ประวัติ heatmap ───── */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <CalendarCheck className="size-4 text-primary" />
          ประวัติความสม่ำเสมอ
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            8 สัปดาห์
          </span>
        </h3>
        <div className="mt-3">
          <AdherenceHeatmap cells={heat} log={log} todayISO={todayISO} />
        </div>
        {!hasLog && (
          <p className="mt-3 text-xs text-muted-foreground">
            ยังไม่มีประวัติ — เริ่มติ๊กกิจกรรม/บันทึกน้ำหนักวันนี้ แล้วช่องจะค่อย ๆ เขียวขึ้น 🟦
          </p>
        )}
      </section>

      {/* ───── สถิติความแข็งแรง (PR ต่อท่า) ───── */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Dumbbell className="size-4 text-primary" />
          สถิติความแข็งแรง
          {prs.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              หนักสุดที่เคยยก
            </span>
          )}
        </h3>
        {prs.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            ยังไม่มีสถิติ — กดบันทึกน้ำหนักที่ยกจริงในแท็บ 🏋️ ออกกำลัง
            (ใต้แต่ละท่า) แล้ว PR ของแต่ละท่าจะขึ้นที่นี่
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {prs.map((pr) => (
              <div
                key={pr.exercise}
                className="flex items-baseline justify-between gap-2 py-2"
              >
                <span className="min-w-0 truncate text-sm font-medium">
                  {pr.exercise}
                </span>
                <span className="tnum shrink-0 text-sm font-bold">
                  {pr.kg} กก. × {pr.reps}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {new Date(`${pr.date}T00:00:00`).toLocaleDateString(
                      "th-TH",
                      { day: "numeric", month: "short" }
                    )}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ───── เป้าวันนี้ ───── */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Target className="size-4 text-primary" />
          เป้าวันนี้
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {DAY_TYPE_LABEL[todayDay.type]}
          </span>
        </h3>
        <NutritionStrip macros={target} />
      </section>

      {/* ───── แก้โปรไฟล์ ───── */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Pencil className="size-4 text-primary" />
          แก้โปรไฟล์
        </h3>
        <div className="mt-3 space-y-3">
          <ProfileField
            label="เป้าหมาย"
            value={eff.goal}
            onCommit={(v) => setProfileField("goal", v)}
          />
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <ProfileField
            label="ช่วงเล่น"
            value={eff.workoutWindow}
            onCommit={(v) => setProfileField("workoutWindow", v)}
          />
        </div>
      </section>

      {/* ───── บัญชี & ซิงค์ ───── */}
      <SyncCard />
    </div>
  );
}

/** ช่องสถิติเล็กใน hero */
function Stat({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl bg-background/60 p-2.5 text-center backdrop-blur-sm">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] leading-none">{label}</span>
      </div>
      <div className="mt-1 tnum text-lg font-bold leading-none">
        {value}
        {unit && (
          <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/** วงแหวนแสดง % ความสม่ำเสมอ (SVG, ไม่ใช้ไลบรารีนอก) */
function ProgressRing({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative grid size-20 shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          className="stroke-muted"
          strokeWidth="3.5"
        />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          className="stroke-primary"
          strokeWidth="3.5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${clamped} 100`}
        />
      </svg>
      <span className="absolute tnum text-base font-bold">{clamped}%</span>
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
        aria-label={label}
        onBlur={(e) => {
          if (e.target.value !== value) {
            onCommit(e.target.value);
            toast.success("บันทึกแล้ว");
          }
        }}
        className="tnum mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
      />
    </label>
  );
}
