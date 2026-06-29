import { Clock, Flame, Snowflake, Moon, Check, TrendingUp } from "lucide-react";
import type { ResolvedDay } from "@/data/types";
import { progressionTips } from "@/data";
import { ExerciseCard } from "@/components/exercise-card";
import { SectionTitle, BulletList } from "@/components/blocks";
import { dayTypeInfo } from "@/components/day-type-badge";
import { Button } from "@/components/ui/button";

export function WorkoutView({
  day,
  done = false,
  isToday = false,
  todayISO,
  onToggleDone,
}: {
  day: ResolvedDay;
  done?: boolean;
  isToday?: boolean;
  todayISO?: string;
  onToggleDone?: () => void;
}) {
  if (!day.workout) {
    return (
      <div className="px-4 py-10">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center">
          <Moon className="size-8 text-muted-foreground" />
          <p className="text-base font-semibold">วันนี้เป็นวันพัก</p>
          <p className="text-sm text-muted-foreground">
            ไม่มีโปรแกรมเล่นเวต พักให้กล้ามฟื้นตัว เดินเล่นหรือยืดเหยียดเบา ๆ ได้
          </p>
        </div>
      </div>
    );
  }

  const { workout, title, type } = day;
  const { Icon } = dayTypeInfo(type);

  return (
    <div className="space-y-6 px-4 py-4">
      {/* หัวข้อ + เวลา */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Icon className="size-5" />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span className="tnum">
            {workout.time.start}–{workout.time.end}
          </span>
        </p>
        {isToday && (
          <Button
            variant={done ? "default" : "outline"}
            size="sm"
            className="mt-3 w-full gap-1.5"
            onClick={onToggleDone}
          >
            <Check className="size-4" />
            {done ? "เล่นเสร็จแล้ว" : "ทำเครื่องหมายว่าเล่นเสร็จ"}
          </Button>
        )}
      </div>

      {/* วอร์มอัพ */}
      <section>
        <SectionTitle icon={<Flame className="size-4" />}>วอร์มอัพ</SectionTitle>
        <BulletList items={workout.warmup} />
      </section>

      {/* รายการท่า */}
      <section>
        <SectionTitle>รายการท่า ({workout.exercises.length})</SectionTitle>
        <div className="mt-2 space-y-2">
          {workout.exercises.map((ex, i) => (
            <ExerciseCard
              key={i}
              exercise={ex}
              index={i}
              isToday={isToday}
              todayISO={todayISO}
            />
          ))}
        </div>
      </section>

      {/* คูลดาวน์ */}
      <section>
        <SectionTitle icon={<Snowflake className="size-4" />}>
          คูลดาวน์
        </SectionTitle>
        <BulletList items={workout.cooldown} />
      </section>

      {/* progression (เฉพาะวันเล่นเวต) */}
      {type === "weights" && (
        <section>
          <SectionTitle icon={<TrendingUp className="size-4" />}>
            เพิ่มน้ำหนักยังไง (progression)
          </SectionTitle>
          <BulletList items={progressionTips} />
        </section>
      )}
    </div>
  );
}
