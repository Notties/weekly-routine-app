import type { ShopItem } from "./types";

// ───────────────────────────────────────────────────────────
// รายการซื้อของรายสัปดาห์ — แก้ชื่อ/ปริมาณ/ราคา/หมวด ได้อิสระ
// recurring: true = ของซื้อครั้งเดียวใช้ได้นาน (ไม่นับในงบสัปดาห์ถัดไป)
// ราคาเป็นค่าประมาณ (บาท) ปรับตามร้านที่ซื้อจริงได้
// ───────────────────────────────────────────────────────────

export const shopping: ShopItem[] = [
  // ── โปรตีน ──
  { name: "อกไก่", qty: "3 กก.", price: 300, category: "โปรตีน", recurring: false },
  { name: "ไข่ไก่", qty: "30 ฟอง", price: 140, category: "โปรตีน", recurring: false },
  { name: "หมูสันใน (สลับกับอกไก่)", qty: "1 กก.", price: 200, category: "โปรตีน", recurring: false },
  { name: "กรีกโยเกิร์ต", qty: "4 ถ้วย", price: 160, category: "โปรตีน", recurring: false },
  { name: "นมจืด", qty: "2 ลิตร", price: 120, category: "โปรตีน", recurring: false },
  { name: "เวย์โปรตีน", qty: "1 กระปุก (~2 กก.)", price: 900, category: "โปรตีน", recurring: true },

  // ── คาร์บ ──
  { name: "ข้าวกล้อง", qty: "5 กก.", price: 250, category: "คาร์บ", recurring: true },
  { name: "ข้าวโอ๊ต", qty: "1 ถุงใหญ่", price: 150, category: "คาร์บ", recurring: true },
  { name: "ขนมปังโฮลวีท", qty: "1 แถว", price: 60, category: "คาร์บ", recurring: false },
  { name: "มันหวาน", qty: "1 กก.", price: 50, category: "คาร์บ", recurring: false },

  // ── ผัก ──
  { name: "บรอกโคลี", qty: "500 ก.", price: 60, category: "ผัก", recurring: false },
  { name: "ผักรวม/คะน้า", qty: "1 กก.", price: 60, category: "ผัก", recurring: false },
  { name: "แครอท", qty: "500 ก.", price: 30, category: "ผัก", recurring: false },
  { name: "ผักสลัด", qty: "1 ถุง", price: 50, category: "ผัก", recurring: false },

  // ── ผลไม้ ──
  { name: "กล้วยหอม", qty: "1 หวี", price: 50, category: "ผลไม้", recurring: false },
  { name: "แอปเปิล", qty: "6 ลูก", price: 90, category: "ผลไม้", recurring: false },
  { name: "ส้ม", qty: "1 กก.", price: 60, category: "ผลไม้", recurring: false },

  // ── ไขมันดี ──
  { name: "อัลมอนด์/ถั่วรวม", qty: "500 ก.", price: 180, category: "ไขมันดี", recurring: false },
  { name: "อะโวคาโด", qty: "3 ลูก", price: 120, category: "ไขมันดี", recurring: false },
  { name: "เนยถั่ว", qty: "1 กระปุก", price: 150, category: "ไขมันดี", recurring: true },

  // ── เครื่องปรุง ──
  { name: "น้ำมันมะกอก", qty: "1 ขวด", price: 220, category: "เครื่องปรุง", recurring: true },
  { name: "น้ำมันรำข้าว", qty: "1 ขวด", price: 80, category: "เครื่องปรุง", recurring: true },
  { name: "ซีอิ๊ว/น้ำปลา", qty: "อย่างละ 1 ขวด", price: 70, category: "เครื่องปรุง", recurring: true },
  { name: "เกลือ/พริกไทย", qty: "ชุด", price: 50, category: "เครื่องปรุง", recurring: true },
  { name: "กาแฟดำ/ผงกาแฟ", qty: "1 ถุง", price: 120, category: "เครื่องปรุง", recurring: true },
  { name: "กระเทียม/หอม", qty: "ชุด", price: 50, category: "เครื่องปรุง", recurring: false },
];

/** ข้อความเตือนดื่มน้ำ (แสดงในแท็บอาหาร) */
export const waterTip =
  "ดื่มน้ำวันละ 2.5–3 ลิตร จิบบ่อย ๆ ระหว่างวัน และดื่มเพิ่ม ~500 มล. ต่อการออกกำลัง 1 ชั่วโมง";

/** ทิปการนอน (แสดงในแท็บนอน) */
export const sleepTips: string[] = [
  "นอนให้ได้ 7–8 ชม. กล้ามเนื้อซ่อมแซมและหลั่งโกรทฮอร์โมนช่วงหลับลึก",
  "เข้านอน–ตื่นเวลาเดิมทุกวัน แม้วันหยุด เพื่อให้นาฬิกาชีวิตนิ่ง",
  "งดคาเฟอีนหลัง 18:00 และงดมือถือ 30 นาทีก่อนนอน",
  "ห้องมืด เย็น เงียบ ช่วยให้หลับเร็วและลึกขึ้น",
  "ถ้าเล่นเวตหนัก ให้ความสำคัญกับการนอนพอ ๆ กับการกินโปรตีน",
];
