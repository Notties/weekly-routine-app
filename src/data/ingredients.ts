import type { CatalogItem } from "./types";

// ───────────────────────────────────────────────────────────
// คลังวัตถุดิบ — qty บอกยี่ห้อ/แพ็กที่ Makro · price อิงราคา Makro โดยประมาณ
// macrosPer100g = มาโครต่อ 100 ก. (อ้างค่ามาตรฐาน ปรับตามฉลากจริงได้)
// หน่วยเทียบ: ไข่ 1 ฟอง ≈ 50 ก. · กล้วย 1 ลูก ≈ 100 ก. · แอปเปิล 1 ลูก ≈ 150 ก.
//   ขนมปัง 1 แผ่น ≈ 30 ก. · นม 1 กล่อง 250 มล. ≈ 250 ก. · เวย์ 1 สกู๊ป ≈ 30 ก.
//   อัลมอนด์ 1 กำมือ ≈ 28 ก. · เนยถั่ว 1 ช้อนโต๊ะ ≈ 16 ก. · น้ำมัน 1 ช้อน (ดูดซับ) ≈ 5 ก.
// เนื้อสัตว์ = น้ำหนักดิบ · ข้าว = น้ำหนักสุก
// ───────────────────────────────────────────────────────────

export const ingredientCatalog: CatalogItem[] = [
  // ── โปรตีน ──
  { name: "อกไก่", qty: "เอโร่ แช่แข็ง ~3 กก. (โลละ ~100฿)", price: 300, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 120, protein: 23, carb: 0, fat: 2.5 } },
  { name: "หมูสันใน", qty: "CP สันในหมู 1 กก.", price: 160, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 120, protein: 21, carb: 0, fat: 3.5 } },
  { name: "ไข่ไก่", qty: "เอโร่ เบอร์ 2-3 แผง 30 ฟอง", price: 120, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 143, protein: 12.6, carb: 0.7, fat: 9.5 } },
  { name: "กรีกโยเกิร์ต", qty: "4 ถ้วย (หรือกระปุกใหญ่ 1 กก.)", price: 180, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 60, protein: 10, carb: 4, fat: 0.5 } },
  { name: "นมจืด", qty: "UHT จืด 1 ลิตร x2", price: 60, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 60, protein: 3.2, carb: 4.8, fat: 3.3 } },
  { name: "เวย์โปรตีน", qty: "ON Gold Standard 2 ปอนด์ (907 ก. ~30 มื้อ)", price: 1290, category: "โปรตีน", recurring: true, macrosPer100g: { kcal: 400, protein: 80, carb: 10, fat: 5 } },

  // ── คาร์บ ──
  { name: "ข้าวกล้อง", qty: "หงษ์ทอง/เอโร่ หอมมะลิ 5 กก.", price: 230, category: "คาร์บ", recurring: true, macrosPer100g: { kcal: 130, protein: 2.7, carb: 28, fat: 0.3 } },
  { name: "ข้าวโอ๊ต", qty: "ควิกโอ๊ต 1 กก.", price: 150, category: "คาร์บ", recurring: true, macrosPer100g: { kcal: 380, protein: 13, carb: 67, fat: 7 } },
  { name: "ขนมปังโฮลวีท", qty: "โฮลวีท 1 แถว", price: 55, category: "คาร์บ", recurring: false, macrosPer100g: { kcal: 250, protein: 12, carb: 43, fat: 3.5 } },

  // ── ผัก ──
  { name: "ผักรวมแช่แข็ง", qty: "เอโร่ บรอกโคลี/แครอท/ข้าวโพด 1.5 กก.", price: 70, category: "ผัก", recurring: false, macrosPer100g: { kcal: 45, protein: 2.5, carb: 8, fat: 0.4 } },

  // ── ผลไม้ ──
  { name: "กล้วยหอม", qty: "1 หวี", price: 40, category: "ผลไม้", recurring: false, macrosPer100g: { kcal: 89, protein: 1.1, carb: 23, fat: 0.3 } },
  { name: "แอปเปิล", qty: "6 ลูก", price: 80, category: "ผลไม้", recurring: false, macrosPer100g: { kcal: 52, protein: 0.3, carb: 14, fat: 0.2 } },

  // ── ไขมันดี ──
  { name: "อัลมอนด์", qty: "อัลมอนด์ดิบ 500 ก.", price: 200, category: "ไขมันดี", recurring: false, macrosPer100g: { kcal: 580, protein: 21, carb: 22, fat: 50 } },
  { name: "เนยถั่ว", qty: "1 กระปุก (~500 ก.)", price: 120, category: "ไขมันดี", recurring: true, macrosPer100g: { kcal: 590, protein: 25, carb: 20, fat: 50 } },

  // ── เครื่องดื่ม ──
  { name: "กาแฟดำ", qty: "กาแฟคั่วบด/ผงกาแฟดำ 1 ถุง", price: 130, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },

  // ── ของหวาน/เบเกอรี่ ──
  { name: "ผงโกโก้", qty: "ผงโกโก้แท้ไม่ใส่น้ำตาล 1 กระปุก", price: 90, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 230, protein: 20, carb: 58, fat: 14 } },
  { name: "อบเชย", qty: "อบเชยป่น 1 ขวดเล็ก", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 247, protein: 4, carb: 81, fat: 1 } },
];

/** ของครัวพื้นฐานที่ต้องมีติดบ้านเสมอ (ใส่ในรายการซื้อของตลอด ไม่ขึ้นกับเมนู) */
export const pantryStaples: CatalogItem[] = [
  { name: "น้ำมันรำข้าว", qty: "1 ลิตร (ทอด/ผัดได้ดี ราคาถูก)", price: 65, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 884, protein: 0, carb: 0, fat: 100 } },
  { name: "เกลือ", qty: "1 ถุง", price: 15, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
  { name: "พริกไทยป่น", qty: "1 กระปุก", price: 30, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
  { name: "ซีอิ๊วขาว", qty: "1 ขวด", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
  { name: "น้ำปลา", qty: "1 ขวด", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
  { name: "กระเทียมสับ", qty: "1 กระปุก/ถุง", price: 30, category: "เครื่องปรุง", recurring: false, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 } },
];
