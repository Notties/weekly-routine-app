"use client";

import * as React from "react";
import {
  ClipboardList,
  Dumbbell,
  Salad,
  BedDouble,
  ShoppingCart,
  BookOpen,
  CalendarCheck,
} from "lucide-react";
import { week } from "@/data";
import type { DayKey } from "@/data/types";
import {
  getSelectedDay,
  setSelectedDay,
  getSwaps,
  setSwap,
} from "@/lib/storage";
import { resolveDay, swapKey } from "@/lib/meals";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile-header";
import { DayPicker } from "@/components/day-picker";
import { DayTypeBadge } from "@/components/day-type-badge";
import { TimelineView } from "@/components/views/timeline-view";
import { WorkoutView } from "@/components/views/workout-view";
import { MealView } from "@/components/views/meal-view";
import { SleepView } from "@/components/views/sleep-view";
import { ShoppingView } from "@/components/views/shopping-view";
import { MenuLibraryView } from "@/components/views/menu-library-view";

const DAY_ORDER: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const TABS = [
  { value: "routine", label: "รูทีน", Icon: ClipboardList },
  { value: "workout", label: "ออกกำลัง", Icon: Dumbbell },
  { value: "meal", label: "อาหาร", Icon: Salad },
  { value: "sleep", label: "นอน", Icon: BedDouble },
  { value: "shopping", label: "ซื้อของ", Icon: ShoppingCart },
  { value: "menu", label: "เมนู", Icon: BookOpen },
] as const;

/** แท็บระดับสัปดาห์ (ไม่ผูกกับวันที่เลือก) */
const WEEK_TABS = new Set(["shopping", "menu"]);

export function RoutineApp() {
  const [selected, setSelected] = React.useState<DayKey>("mon");
  const [today, setToday] = React.useState<DayKey | null>(null);
  const [tab, setTab] = React.useState<string>("routine");
  const [swaps, setSwaps] = React.useState<Record<string, string>>({});
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);

  // หลัง mount: รู้ "วันนี้" + ใช้วันที่เลือกล่าสุด + โหลดการสลับเมนู
  React.useEffect(() => {
    const stored = getSelectedDay() as DayKey | null;
    const t = DAY_ORDER[new Date().getDay()];
    setToday(t);
    setSelected(stored ?? t);
    setSwaps(getSwaps());
  }, []);

  const handleSelect = (key: DayKey) => {
    setSelected(key);
    setSelectedDay(key);
  };

  // สลับเมนูของมื้อหนึ่ง (จำรายวันรายมื้อ)
  const applySwap = (mealIndex: number, recipeId: string) => {
    const key = swapKey(selected, mealIndex);
    setSwap(key, recipeId);
    setSwaps((prev) => ({ ...prev, [key]: recipeId }));
  };

  const handleTab = (value: string) => {
    setTab(value);
    // เปลี่ยนแท็บแล้วเลื่อนกลับขึ้นบนสุด
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  };

  // ปัดซ้าย/ขวาเพื่อเปลี่ยนวัน (เฉพาะแท็บที่ผูกกับวัน)
  const changeDayBy = (dir: number) => {
    const idx = week.findIndex((d) => d.key === selected);
    const next = (idx + dir + week.length) % week.length;
    handleSelect(week[next].key);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || WEEK_TABS.has(tab)) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // เป็นการปัดแนวนอนชัดเจน (ไม่ใช่เลื่อนขึ้นลง)
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      changeDayBy(dx < 0 ? 1 : -1);
    }
  };

  const day = week.find((d) => d.key === selected) ?? week[0];
  const resolvedDay = React.useMemo(
    () => resolveDay(day, swaps),
    [day, swaps]
  );

  return (
    <Tabs
      value={tab}
      onValueChange={handleTab}
      className="flex min-h-full flex-col gap-0"
    >
      {/* บล็อกหัวติดบน — พื้นทึบชั้นเดียว (header + เลือกวัน + แท็บ) */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <ProfileHeader />
        <DayPicker
          selected={selected}
          today={today}
          onSelect={handleSelect}
        />
        <TabsList className="mx-auto grid h-auto w-full max-w-2xl grid-cols-6 rounded-none bg-background p-0 group-data-horizontal/tabs:h-auto">
          {TABS.map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-auto flex-col gap-1 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0.5 py-2.5 text-[10px] leading-tight shadow-none data-active:border-primary data-active:bg-transparent data-active:font-semibold data-active:text-primary data-active:shadow-none dark:data-active:border-primary dark:data-active:bg-transparent dark:data-active:text-primary"
            >
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <main
        className="mx-auto w-full max-w-2xl flex-1 pb-safe"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* แถบบอกวัน (ซ่อนในแท็บระดับสัปดาห์: ซื้อของ/เมนู) */}
        {!WEEK_TABS.has(tab) && (
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <span>
                {day.label}
                {day.type !== "rest" && (
                  <span className="ml-2 font-medium text-muted-foreground">
                    {day.title}
                  </span>
                )}
              </span>
              {today && selected !== today && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelect(today)}
                  className="h-6 gap-1 px-2 text-xs font-medium text-primary hover:text-primary"
                >
                  <CalendarCheck className="size-3.5" />
                  วันนี้
                </Button>
              )}
            </h2>
            <DayTypeBadge type={day.type} />
          </div>
        )}

        <TabsContent value="routine">
          <TimelineView day={resolvedDay} isToday={selected === today} />
        </TabsContent>
        <TabsContent value="workout">
          <WorkoutView day={resolvedDay} />
        </TabsContent>
        <TabsContent value="meal">
          <MealView day={resolvedDay} onSwap={applySwap} />
        </TabsContent>
        <TabsContent value="sleep">
          <SleepView day={resolvedDay} />
        </TabsContent>
        <TabsContent value="shopping">
          <ShoppingView swaps={swaps} />
        </TabsContent>
        <TabsContent value="menu">
          <MenuLibraryView />
        </TabsContent>
      </main>
    </Tabs>
  );
}
