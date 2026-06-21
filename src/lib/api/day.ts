import { prisma } from "@/lib/prisma";

/** upsert DayLog ของ (userId,date) แล้วคืน row id — ใช้ก่อนแตะ meals/lifts */
export async function ensureDayLog(userId: string, date: string): Promise<{ id: string }> {
  return prisma.dayLog.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
    select: { id: true },
  });
}
