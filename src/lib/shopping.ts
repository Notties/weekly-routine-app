import type { ShopItem, ShopCategory } from "@/data/types";

export type ShoppingTotals = {
  /** ผลรวมราคาต่อหมวด */
  byCategory: Record<string, number>;
  /** ผลรวมราคาทั้งหมด */
  grandTotal: number;
  /** งบสัปดาห์ถัดไป = ของที่ต้องซื้อทุกสัปดาห์ (recurring=false) */
  weeklyTotal: number;
  /** ของซื้อครั้งเดียวใช้นาน (recurring=true) */
  oneTimeTotal: number;
  /** เฉลี่ยต่อวัน = งบสัปดาห์ / 7 */
  perDay: number;
};

/** จัดกลุ่มรายการตามหมวด (คงลำดับตามอินพุต) */
export function groupByCategory(
  items: ShopItem[]
): Record<string, ShopItem[]> {
  const groups: Record<string, ShopItem[]> = {};
  for (const item of items) {
    (groups[item.category] ??= []).push(item);
  }
  return groups;
}

/** คำนวณยอดรวมต่าง ๆ ของรายการซื้อของ */
export function shoppingTotals(items: ShopItem[]): ShoppingTotals {
  const byCategory: Record<string, number> = {};
  let grandTotal = 0;
  let weeklyTotal = 0;
  let oneTimeTotal = 0;

  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + item.price;
    grandTotal += item.price;
    if (item.recurring) {
      oneTimeTotal += item.price;
    } else {
      weeklyTotal += item.price;
    }
  }

  return {
    byCategory,
    grandTotal,
    weeklyTotal,
    oneTimeTotal,
    perDay: weeklyTotal / 7,
  };
}

/** แยกรายการเป็น 2 กลุ่ม: รายสัปดาห์ vs ของใช้นาน */
export function splitRecurring(items: ShopItem[]): {
  weekly: ShopItem[];
  longLasting: ShopItem[];
} {
  return {
    weekly: items.filter((i) => !i.recurring),
    longLasting: items.filter((i) => i.recurring),
  };
}

/** คีย์เฉพาะของแต่ละรายการ (ใช้จำสถานะติ๊กใน localStorage) */
export function itemKey(item: ShopItem): string {
  return `${item.category}:${item.name}`;
}

export type { ShopCategory };
