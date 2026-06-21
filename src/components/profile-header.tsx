import type { Profile } from "@/data/types";
import { ThemeToggle } from "@/components/theme-toggle";

export function ProfileHeader({
  profile,
  onOpen,
}: {
  profile: Profile;
  onOpen?: () => void;
}) {
  return (
    <header className="border-b border-border pt-safe">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 text-left"
        >
          <h1 className="truncate text-base font-bold tracking-tight">
            รูทีนฟิตเนสรายสัปดาห์
          </h1>
          <p className="truncate text-xs text-muted-foreground tnum">
            {profile.sex} · {profile.age} ปี · {profile.weightKg} กก. ·{" "}
            {profile.goal}
          </p>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
