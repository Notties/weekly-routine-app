import type { CatalogItem, ShopItem } from "@/data/types";

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

export type ConsumptionCost = {
  /** ค่าอาหารตามกรัมที่กินจริงต่อสัปดาห์ */
  weeklyBaht: number;
  /** ต่อเดือน (× ~4.3 สัปดาห์) */
  monthlyBaht: number;
};

/**
 * ต้นทุน "ตามที่กินจริง" — กรัมที่ใช้ × ราคาต่อกรัมของแพ็ค
 * ต่างจาก monthlyCost ที่คิดราคาทั้งแพ็คทุกสัปดาห์ (= งบรอบซื้อ ไม่ใช่ค่ากิน
 * เพราะแพ็คใหญ่ เช่น อัลมอนด์/กะหล่ำ/นมแพ็ค 12 กินข้ามสัปดาห์)
 */
export function consumptionCost(
  used: { name: string; grams: number }[],
  catalog: CatalogItem[]
): ConsumptionCost {
  const byName = new Map(catalog.map((c) => [c.name, c] as const));
  let weekly = 0;
  for (const u of used) {
    const item = byName.get(u.name);
    if (!item || item.packGrams <= 0) continue;
    weekly += (u.grams * item.price) / item.packGrams;
  }
  return {
    weeklyBaht: Math.round(weekly),
    monthlyBaht: Math.round(weekly * WEEKS_PER_MONTH),
  };
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
