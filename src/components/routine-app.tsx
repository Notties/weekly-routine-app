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
import { profile, week } from "@/data";
import type { DayKey } from "@/data/types";
import { useAppStore } from "@/lib/store";
import { DAY_ORDER, effectiveProfile, toISODate } from "@/lib/tracking";
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
import { MeView } from "@/components/views/me-view";
import { RestTimerBar } from "@/components/rest-timer-bar";
import { SyncCard } from "@/components/sync-card";

const TABS = [
  { value: "routine", label: "รูทีน", Icon: ClipboardList },
  { value: "workout", label: "ออกกำลัง", Icon: Dumbbell },
  { value: "meal", label: "อาหาร", Icon: Salad },
  { value: "sleep", label: "นอน", Icon: BedDouble },
  { value: "shopping", label: "ซื้อของ", Icon: ShoppingCart },
  { value: "menu", label: "เมนู", Icon: BookOpen },
] as const;

/** แท็บที่ไม่ผูกกับวันที่เลือก (ซ่อนแถบวัน + ปิดปัดเปลี่ยนวัน) */
const WEEK_TABS = new Set(["shopping", "menu", "me"]);

export function RoutineApp() {
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const authRequired = useAppStore((s) => s.authRequired);
  const selected = useAppStore((s) => s.selectedDay);
  const swaps = useAppStore((s) => s.swaps);
  const profileOverride = useAppStore((s) => s.profileOverride);
  const log = useAppStore((s) => s.log);
  const setSelectedDay = useAppStore((s) => s.setSelectedDay);
  const setSwap = useAppStore((s) => s.setSwap);
  const toggleMeal = useAppStore((s) => s.toggleMeal);
  const addWater = useAppStore((s) => s.addWater);
  const addExtra = useAppStore((s) => s.addExtra);
  const clearExtra = useAppStore((s) => s.clearExtra);
  const setWorkoutDone = useAppStore((s) => s.setWorkoutDone);
  const syncError = useAppStore((s) => s.syncError);

  const [today, setToday] = React.useState<DayKey | null>(null);
  const [tab, setTab] = React.useState<string>("routine");
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);

  // mount: โหลด state จาก backend + รู้ "วันนี้"
  React.useEffect(() => {
    void useAppStore.getState().hydrate();
    setToday(DAY_ORDER[new Date().getDay()]);
  }, []);

  // หลัง hydrate: ถ้ายังไม่เคยเลือกวัน ใช้วันนี้
  React.useEffect(() => {
    if (hasHydrated && !selected && today) setSelectedDay(today);
  }, [hasHydrated, selected, today, setSelectedDay]);

  const handleSelect = (key: DayKey) => setSelectedDay(key);

  const applySwap = (mealIndex: number, recipeId: string) => {
    if (!selected) return;
    setSwap(swapKey(selected, mealIndex), recipeId);
  };

  const handleTab = (value: string) => {
    setTab(value);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const changeDayBy = (dir: number) => {
    const cur = selected ?? "mon";
    const idx = week.findIndex((d) => d.key === cur);
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
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      changeDayBy(dx < 0 ? 1 : -1);
    }
  };

  // gate: กัน hydration mismatch (static export)
  if (!hasHydrated) {
    return <div className="min-h-full" />;
  }

  // gate: ยังไม่ได้ login — แสดงหน้าเข้าระบบแทน routine
  if (authRequired) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <SyncCard />
        </div>
      </div>
    );
  }

  if (!selected) {
    return <div className="min-h-full" />;
  }

  const day = week.find((d) => d.key === selected) ?? week[0];
  const resolvedDay = resolveDay(day, swaps);
  const effProfile = effectiveProfile(profile, profileOverride, log);
  const todayISO = toISODate(new Date());
  const isToday = selected === today;
  const dateLog = log[todayISO];

  return (
    <>
      {syncError && (
        <div className="bg-destructive/10 px-4 py-1.5 text-center text-xs text-destructive">
          {syncError}
        </div>
      )}
    <Tabs
      value={tab}
      onValueChange={handleTab}
      className="flex min-h-full flex-col gap-0"
    >
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <ProfileHeader onOpen={() => handleTab("me")} />
        <DayPicker selected={selected} today={today} onSelect={handleSelect} />
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
          <WorkoutView
            day={resolvedDay}
            done={!!dateLog?.workoutDone}
            isToday={isToday}
            todayISO={todayISO}
            onToggleDone={() => setWorkoutDone(todayISO, !dateLog?.workoutDone)}
          />
        </TabsContent>
        <TabsContent value="meal">
          <MealView
            day={resolvedDay}
            profile={effProfile}
            onSwap={applySwap}
            dateLog={dateLog}
            isToday={isToday}
            onToggleMeal={(i) => toggleMeal(todayISO, i)}
            onAddWater={(d) => addWater(todayISO, d)}
            onAddExtra={(k, p) => addExtra(todayISO, k, p)}
            onClearExtra={() => clearExtra(todayISO)}
          />
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
        {tab === "me" && (
          <MeView todayISO={todayISO} onBack={() => handleTab("routine")} />
        )}
      </main>
    </Tabs>
    <RestTimerBar />
    </>
  );
}
