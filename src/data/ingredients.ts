import type { CatalogItem } from "./types";

// ───────────────────────────────────────────────────────────
// คลังวัตถุดิบ — กำหนดปริมาณ/ราคาต่อสัปดาห์ของวัตถุดิบแต่ละชนิด
// รายการซื้อของจะหยิบเฉพาะวัตถุดิบที่ "เมนูในสัปดาห์นั้นใช้จริง" มาแสดง
// เพิ่มวัตถุดิบใหม่ที่นี่ แล้วอ้างชื่อในเมนู (recipes.ts) ได้เลย
// ───────────────────────────────────────────────────────────

export const ingredientCatalog: CatalogItem[] = [
  // โปรตีน
  { name: "อกไก่", qty: "3 กก.", price: 300, category: "โปรตีน", recurring: false },
  { name: "หมูสันใน", qty: "1 กก.", price: 200, category: "โปรตีน", recurring: false },
  { name: "ไข่ไก่", qty: "30 ฟอง", price: 140, category: "โปรตีน", recurring: false },
  { name: "กรีกโยเกิร์ต", qty: "4 ถ้วย", price: 160, category: "โปรตีน", recurring: false },
  { name: "นมจืด", qty: "2 ลิตร", price: 120, category: "โปรตีน", recurring: false },
  { name: "เวย์โปรตีน", qty: "1 กระปุก", price: 900, category: "โปรตีน", recurring: true },

  // คาร์บ
  { name: "ข้าวกล้อง", qty: "5 กก.", price: 250, category: "คาร์บ", recurring: true },
  { name: "ข้าวโอ๊ต", qty: "1 ถุงใหญ่", price: 150, category: "คาร์บ", recurring: true },
  { name: "ขนมปังโฮลวีท", qty: "1 แถว", price: 60, category: "คาร์บ", recurring: false },

  // ผัก
  { name: "ผักรวม/บรอกโคลี", qty: "1.5 กก.", price: 150, category: "ผัก", recurring: false },

  // ผลไม้
  { name: "กล้วยหอม", qty: "1 หวี", price: 50, category: "ผลไม้", recurring: false },
  { name: "แอปเปิล", qty: "6 ลูก", price: 90, category: "ผลไม้", recurring: false },

  // ไขมันดี
  { name: "อัลมอนด์/ถั่วรวม", qty: "500 ก.", price: 180, category: "ไขมันดี", recurring: false },
  { name: "เนยถั่ว", qty: "1 กระปุก", price: 150, category: "ไขมันดี", recurring: true },

  // เครื่องดื่ม
  { name: "กาแฟดำ", qty: "1 ถุง", price: 120, category: "เครื่องปรุง", recurring: true },
];

/** ของครัวพื้นฐานที่ต้องมีติดบ้านเสมอ (ใส่ในรายการซื้อของตลอด ไม่ขึ้นกับเมนู) */
export const pantryStaples: CatalogItem[] = [
  { name: "น้ำมัน (มะกอก/รำข้าว)", qty: "1 ขวด", price: 200, category: "เครื่องปรุง", recurring: true },
  { name: "เกลือ/พริกไทย", qty: "ชุด", price: 50, category: "เครื่องปรุง", recurring: true },
  { name: "ซีอิ๊ว/น้ำปลา", qty: "อย่างละ 1 ขวด", price: 70, category: "เครื่องปรุง", recurring: true },
  { name: "กระเทียม/หอม", qty: "ชุด", price: 50, category: "เครื่องปรุง", recurring: false },
];
