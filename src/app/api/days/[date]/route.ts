import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { DayScalarSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ date: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { date } = await params;
    const data = DayScalarSchema.parse(await req.json());
    await prisma.dayLog.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...data },
      update: data,
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}
