import { ingredientCatalog, pantryStaples } from "@/data/ingredients";
import type { CatalogItem } from "@/data/types";

// แผนที่ชื่อวัตถุดิบ → รายการใน catalog (รวมของครัวพื้นฐาน)
const catalogByName = new Map<string, CatalogItem>(
  [...ingredientCatalog, ...pantryStaples].map((c) => [c.name, c] as const)
);

/**
 * แปลงกรัมเป็นหน่วยบ้าน ๆ ที่มือใหม่จับต้องได้ เช่น
 * ไข่ไก่ 150 ก. → "3 ฟอง (150 ก.)" · กล้วย 120 ก. → "1.2 ลูก (120 ก.)"
 * ของที่ไม่มีหน่วยนับ (ต้องชั่ง) หรือปริมาณต่ำกว่าครึ่งหน่วย → กรัมล้วน "220 ก."
 */
export function portionLabel(name: string, grams: number): string {
  const unit = catalogByName.get(name)?.unit;
  if (unit) {
    const qty = Math.round((grams / unit.grams) * 10) / 10;
    if (qty >= 0.5) {
      const qtyText = Number.isInteger(qty) ? String(qty) : qty.toFixed(1);
      return `${qtyText} ${unit.label} (${grams} ก.)`;
    }
  }
  return `${grams} ก.`;
}
