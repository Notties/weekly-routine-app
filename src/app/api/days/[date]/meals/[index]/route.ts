import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json, ApiError } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { ensureDayLog } from "@/lib/api/day";

type Ctx = { params: Promise<{ date: string; index: string }> };

function parseIndex(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) throw new ApiError(400, "invalid meal index");
  return n;
}

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date, index } = await params;
    const mealIndex = parseIndex(index);
    const day = await ensureDayLog(userId, date);
    await prisma.mealCheck.upsert({
      where: { dayLogId_mealIndex: { dayLogId: day.id, mealIndex } },
      create: { dayLogId: day.id, mealIndex },
      update: {},
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date, index } = await params;
    const mealIndex = parseIndex(index);
    // ลบเฉพาะถ้า dayLog เป็นของ user นี้ (กันแตะข้ามผู้ใช้)
    await prisma.mealCheck.deleteMany({
      where: { mealIndex, dayLog: { userId, date } },
    });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
