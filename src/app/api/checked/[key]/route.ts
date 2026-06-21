import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ key: string }> };

// ทำเครื่องหมาย ingredient key ว่าถูก checked (upsert)
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { key } = await params;
    await prisma.checkedItem.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key },
      update: {},
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}

// ลบ checked item สำหรับ key นั้น ๆ
export async function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { key } = await params;
    await prisma.checkedItem.deleteMany({ where: { userId, key } });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
