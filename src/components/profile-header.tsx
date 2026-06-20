import { profile } from "@/data";
import { ThemeToggle } from "@/components/theme-toggle";

export function ProfileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md pt-safe">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight">
            รูทีนฟิตเนสรายสัปดาห์
          </h1>
          <p className="truncate text-xs text-muted-foreground tnum">
            {profile.sex} · {profile.age} ปี · {profile.heightCm} ซม. ·{" "}
            {profile.goal}
          </p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
