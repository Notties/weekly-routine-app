import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { SwapSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ key: string }> };

// อัปเดต swap สำหรับ meal key นั้น ๆ (upsert)
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { key } = await params;
    const { recipeId } = SwapSchema.parse(await req.json());
    await prisma.swap.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, recipeId },
      update: { recipeId },
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}

// ลบ swap สำหรับ meal key นั้น ๆ
export async function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const userId = await requireUser(req);
    const { key } = await params;
    await prisma.swap.deleteMany({ where: { userId, key } });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
