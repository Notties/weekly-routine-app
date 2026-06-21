import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { ensureDayLog } from "@/lib/api/day";
import { LiftSetsSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ date: string; exercise: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date, exercise: rawExercise } = await params;
    const exercise = decodeURIComponent(rawExercise);
    const { sets } = LiftSetsSchema.parse(await req.json());
    const day = await ensureDayLog(userId, date);
    // replace ทั้งท่า: ลบเก่า → ใส่ใหม่ ใน transaction
    await prisma.$transaction([
      prisma.liftSet.deleteMany({ where: { dayLogId: day.id, exercise } }),
      prisma.liftSet.createMany({
        data: sets.map((s, setIndex) => ({
          dayLogId: day.id, exercise, setIndex, kg: s.kg, reps: s.reps,
        })),
      }),
    ]);
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date, exercise: rawExercise } = await params;
    const exercise = decodeURIComponent(rawExercise);
    await prisma.liftSet.deleteMany({
      where: { exercise, dayLog: { userId, date } },
    });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
