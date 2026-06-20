import type { ShopItem } from "@/data/types";

export type WaterPack = { bottles: number; literEach: number; price: number };

export type MonthlyCost = {
  /** ของสดรายสัปดาห์ × จำนวนสัปดาห์ต่อเดือน */
  freshPerMonth: number;
  /** ของใช้นาน (ตุน ~เดือนละครั้ง) */
  stockPerMonth: number;
  foodPerMonth: number;
  /** น้ำดื่ม */
  waterLitersPerMonth: number;
  waterBottlesPerMonth: number;
  waterPacksPerMonth: number;
  waterPerMonth: number;
  /** รวมทั้งหมดต่อเดือน + เฉลี่ยต่อวัน */
  totalPerMonth: number;
  perDay: number;
};

/** ~4.3 สัปดาห์ต่อเดือน (30/7) */
export const WEEKS_PER_MONTH = 30 / 7;

/** จำนวนขวดน้ำที่ต้องดื่มต่อวัน (ปัด 1 ตำแหน่ง) */
export function bottlesPerDay(litersPerDay: number, literEach: number): number {
  return Math.round((litersPerDay / literEach) * 10) / 10;
}

export function monthlyCost(
  items: ShopItem[],
  opts: { litersPerDay: number; pack: WaterPack }
): MonthlyCost {
  let weekly = 0;
  let recurring = 0;
  for (const item of items) {
    if (item.recurring) recurring += item.price;
    else weekly += item.price;
  }

  const freshPerMonth = Math.round(weekly * WEEKS_PER_MONTH);
  const stockPerMonth = recurring;
  const foodPerMonth = freshPerMonth + stockPerMonth;

  const packLiters = opts.pack.bottles * opts.pack.literEach;
  const waterLitersPerMonth = Math.round(opts.litersPerDay * 30);
  const waterBottlesPerMonth = Math.ceil(
    waterLitersPerMonth / opts.pack.literEach
  );
  const waterPacksPerMonth = Math.ceil(waterLitersPerMonth / packLiters);
  const waterPerMonth = waterPacksPerMonth * opts.pack.price;

  const totalPerMonth = foodPerMonth + waterPerMonth;

  return {
    freshPerMonth,
    stockPerMonth,
    foodPerMonth,
    waterLitersPerMonth,
    waterBottlesPerMonth,
    waterPacksPerMonth,
    waterPerMonth,
    totalPerMonth,
    perDay: Math.round(totalPerMonth / 30),
  };
}
