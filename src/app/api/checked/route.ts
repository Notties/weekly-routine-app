import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

// ลบ checked items ทั้งหมดของผู้ใช้ (clear all)
export async function DELETE(req: Request) {
  return handle(async () => {
    const userId = await requireUser(req);
    await prisma.checkedItem.deleteMany({ where: { userId } });
    revalidateTag(`state:${userId}`, "max");
    return new Response(null, { status: 204 });
  });
}
