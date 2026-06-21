import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { MigrateSchema } from "@/lib/api/schemas";
import { sliceToRows } from "@/lib/api/state-mapper";
import type { SyncSlice } from "@/lib/api/types";

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await requireUser(req);
    const slice = MigrateSchema.parse(await req.json()) as SyncSlice;
    const rows = sliceToRows(slice);

    // idempotent: upsert ทุกอย่าง — เรียกซ้ำได้ไม่พัง
    if (rows.profile) {
      await prisma.profile.upsert({
        where: { userId },
        create: { userId, ...rows.profile },
        update: rows.profile,
      });
    }
    for (const s of rows.swaps) {
      await prisma.swap.upsert({
        where: { userId_key: { userId, key: s.key } },
        create: { userId, key: s.key, recipeId: s.recipeId },
        update: { recipeId: s.recipeId },
      });
    }
    for (const c of rows.checked) {
      await prisma.checkedItem.upsert({
        where: { userId_key: { userId, key: c.key } },
        create: { userId, key: c.key },
        update: {},
      });
    }
    for (const d of rows.days) {
      const day = await prisma.dayLog.upsert({
        where: { userId_date: { userId, date: d.date } },
        create: {
          userId, date: d.date, weightKg: d.weightKg,
          workoutDone: d.workoutDone, waterMl: d.waterMl,
          extraKcal: d.extraKcal, extraProtein: d.extraProtein,
        },
        update: {
          weightKg: d.weightKg, workoutDone: d.workoutDone, waterMl: d.waterMl,
          extraKcal: d.extraKcal, extraProtein: d.extraProtein,
        },
        select: { id: true },
      });
      for (const mealIndex of d.meals) {
        await prisma.mealCheck.upsert({
          where: { dayLogId_mealIndex: { dayLogId: day.id, mealIndex } },
          create: { dayLogId: day.id, mealIndex },
          update: {},
        });
      }
      for (const l of d.lifts) {
        await prisma.$transaction([
          prisma.liftSet.deleteMany({ where: { dayLogId: day.id, exercise: l.exercise } }),
          prisma.liftSet.createMany({
            data: l.sets.map((s, setIndex) => ({
              dayLogId: day.id, exercise: l.exercise, setIndex, kg: s.kg, reps: s.reps,
            })),
          }),
        ]);
      }
    }

    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}
