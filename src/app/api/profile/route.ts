import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { ProfileSchema } from "@/lib/api/schemas";

// อัปเดตโปรไฟล์ผู้ใช้ (upsert)
export async function PUT(req: Request) {
  return handle(async () => {
    const userId = await requireUser(req);
    const data = ProfileSchema.parse(await req.json());
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    revalidateTag(`state:${userId}`, "max");
    return json({ ok: true });
  });
}
