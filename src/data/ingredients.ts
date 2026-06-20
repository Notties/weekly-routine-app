import type { CatalogItem } from "./types";

// ───────────────────────────────────────────────────────────
// คลังวัตถุดิบ — qty บอกยี่ห้อ/แพ็กที่ Makro · price อิงราคา Makro โดยประมาณ
// (มิ.ย. 2026 · ปรับได้ตามจริง) รายการซื้อของหยิบเฉพาะที่เมนูในสัปดาห์ใช้
// ───────────────────────────────────────────────────────────

export const ingredientCatalog: CatalogItem[] = [
  // ── โปรตีน ──
  { name: "อกไก่", qty: "เอโร่ แช่แข็ง ~3 กก. (โลละ ~100฿)", price: 300, category: "โปรตีน", recurring: false },
  { name: "หมูสันใน", qty: "CP สันในหมู 1 กก.", price: 160, category: "โปรตีน", recurring: false },
  { name: "ไข่ไก่", qty: "เอโร่ เบอร์ 2-3 แผง 30 ฟอง", price: 120, category: "โปรตีน", recurring: false },
  { name: "กรีกโยเกิร์ต", qty: "4 ถ้วย (หรือกระปุกใหญ่ 1 กก.)", price: 180, category: "โปรตีน", recurring: false },
  { name: "นมจืด", qty: "UHT จืด 1 ลิตร x2", price: 60, category: "โปรตีน", recurring: false },
  { name: "เวย์โปรตีน", qty: "ON Gold Standard 2 ปอนด์ (907 ก. ~30 มื้อ)", price: 1290, category: "โปรตีน", recurring: true },

  // ── คาร์บ ──
  { name: "ข้าวกล้อง", qty: "หงษ์ทอง/เอโร่ หอมมะลิ 5 กก.", price: 230, category: "คาร์บ", recurring: true },
  { name: "ข้าวโอ๊ต", qty: "ควิกโอ๊ต 1 กก.", price: 150, category: "คาร์บ", recurring: true },
  { name: "ขนมปังโฮลวีท", qty: "โฮลวีท 1 แถว", price: 55, category: "คาร์บ", recurring: false },

  // ── ผัก ──
  // ผักรวมแช่แข็ง = บรอกโคลี + แครอท + ข้าวโพด/ถั่วลันเตา — เข้าไมโครเวฟได้เลย ไม่ต้องล้าง/หั่น
  { name: "ผักรวมแช่แข็ง", qty: "เอโร่ บรอกโคลี/แครอท/ข้าวโพด 1.5 กก.", price: 70, category: "ผัก", recurring: false },

  // ── ผลไม้ ──
  { name: "กล้วยหอม", qty: "1 หวี", price: 40, category: "ผลไม้", recurring: false },
  { name: "แอปเปิล", qty: "6 ลูก", price: 80, category: "ผลไม้", recurring: false },

  // ── ไขมันดี ──
  { name: "อัลมอนด์", qty: "อัลมอนด์ดิบ 500 ก.", price: 200, category: "ไขมันดี", recurring: false },
  { name: "เนยถั่ว", qty: "1 กระปุก (~500 ก.)", price: 120, category: "ไขมันดี", recurring: true },

  // ── เครื่องดื่ม ──
  { name: "กาแฟดำ", qty: "กาแฟคั่วบด/ผงกาแฟดำ 1 ถุง", price: 130, category: "เครื่องปรุง", recurring: true },
];

/** ของครัวพื้นฐานที่ต้องมีติดบ้านเสมอ (ใส่ในรายการซื้อของตลอด ไม่ขึ้นกับเมนู) */
export const pantryStaples: CatalogItem[] = [
  { name: "น้ำมันรำข้าว", qty: "1 ลิตร (ทอด/ผัดได้ดี ราคาถูก)", price: 65, category: "เครื่องปรุง", recurring: true },
  { name: "เกลือ", qty: "1 ถุง", price: 15, category: "เครื่องปรุง", recurring: true },
  { name: "พริกไทยป่น", qty: "1 กระปุก", price: 30, category: "เครื่องปรุง", recurring: true },
  { name: "ซีอิ๊วขาว", qty: "1 ขวด", price: 35, category: "เครื่องปรุง", recurring: true },
  { name: "น้ำปลา", qty: "1 ขวด", price: 35, category: "เครื่องปรุง", recurring: true },
  { name: "กระเทียมสับ", qty: "1 กระปุก/ถุง", price: 30, category: "เครื่องปรุง", recurring: false },
];
