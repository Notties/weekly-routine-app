import { cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rowsToSlice } from "./state-mapper";
import type { StateRows, SyncSlice } from "./types";

/**
 * อ่าน state ทั้งก้อนของผู้ใช้ — ห่อ use cache + tag ต่อ user
 * NOTE: ห้ามอ่าน headers/token ที่นี่ (use cache เข้าไม่ได้) — รับ userId เป็น arg
 */
export async function getCachedState(userId: string): Promise<SyncSlice> {
  "use cache";
  cacheTag(`state:${userId}`);

  const [profile, swaps, checked, dayLogs] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.swap.findMany({ where: { userId } }),
    prisma.checkedItem.findMany({ where: { userId } }),
    prisma.dayLog.findMany({
      where: { userId },
      include: { meals: true, lifts: true },
    }),
  ]);

  return rowsToSlice({ profile, swaps, checked, dayLogs } as StateRows);
}
