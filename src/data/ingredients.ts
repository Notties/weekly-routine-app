import type { CatalogItem } from "./types";

// ───────────────────────────────────────────────────────────
// คลังวัตถุดิบ — qty บอกยี่ห้อ/แพ็กที่ Makro · price อิงราคา Makro โดยประมาณ
// macrosPer100g = มาโครต่อ 100 ก. (อ้างค่ามาตรฐาน ปรับตามฉลากจริงได้)
// storage = โซนเก็บ + วิธีเก็บ + อายุ (แสดงในส่วน "แบ่งเก็บ" ของแท็บซื้อของ)
// หน่วยเทียบ: ไข่ 1 ฟอง ≈ 50 ก. · กล้วย 1 ลูก ≈ 100 ก. · แอปเปิล 1 ลูก ≈ 150 ก.
//   ขนมปัง 1 แผ่น ≈ 30 ก. · นม 1 กล่อง 250 มล. ≈ 250 ก. · เวย์ 1 สกู๊ป ≈ 30 ก.
//   อัลมอนด์ 1 กำมือ ≈ 28 ก. · เนยถั่ว 1 ช้อนโต๊ะ ≈ 16 ก. · น้ำมัน 1 ช้อน (ดูดซับ) ≈ 5 ก.
// เนื้อสัตว์ = น้ำหนักดิบ · ข้าว = น้ำหนักสุก
// ───────────────────────────────────────────────────────────

export const ingredientCatalog: CatalogItem[] = [
  // ── โปรตีน ──
  { name: "อกไก่", qty: "เอโร่ แช่แข็ง 3 กก. (ใช้ ~3 กก./สัปดาห์พอดีแพ็ค)", price: 300, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 120, protein: 23, carb: 0, fat: 2.5 },
    storage: { zone: "freezer", note: "ชั่งแบ่งถุงซิปเป็นก้อนต่อวันก่อนแช่ เขียนชื่อวัน · ทุกคืนย้ายถุงพรุ่งนี้ลงช่องเย็นให้ละลายเอง (ห้ามละลายนอกตู้)", life: "หลายเดือน · ละลายแล้วใช้ใน 1–2 วัน" } },
  { name: "หมูสันใน", qty: "CP สันในหมู 1 กก. (ใช้ 400 ก./สัปดาห์ — แพ็คอยู่ ~2.5 สัปดาห์ แบ่งแช่แข็ง)", price: 160, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 120, protein: 21, carb: 0, fat: 3.5 },
    storage: { zone: "freezer", note: "แบ่งถุงละมื้อเหมือนอกไก่ · ละลายในช่องเย็นข้ามคืน", life: "หลายเดือน · ละลายแล้วใช้ใน 1–2 วัน" } },
  { name: "ไข่ไก่", unit: { grams: 50, label: "ฟอง" }, qty: "แผง 10 ฟอง เบอร์ 2 (ใช้แค่ 6 ฟอง/สัปดาห์ — คุมคอเลสเตอรอล)", price: 55, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 143, protein: 12.6, carb: 0.7, fat: 9.5 },
    storage: { zone: "fridge", note: "เก็บทั้งแผงวางชั้นในตู้ (ไม่วางที่ประตู อุณหภูมิแกว่ง) ไม่ต้องล้างก่อนเก็บ · ไข่ต้มสุกไม่ปอกเปลือกอยู่ได้ ~1 สัปดาห์", life: "3–5 สัปดาห์" } },
  { name: "เต้าหู้ไข่", unit: { grams: 120, label: "หลอด" }, qty: "เต้าหู้ไข่หลอด ~120 ก. × 1 (มื้อเย็นพฤหัส)", price: 15, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 82, protein: 6.8, carb: 2.5, fat: 5 },
    storage: { zone: "fridge", note: "แช่เย็นทั้งหลอด · เปิดแล้วใช้ให้หมดหลอดในมื้อนั้น", life: "ยังไม่เปิดตามฉลาก (~2–3 สัปดาห์)" } },
  { name: "กรีกโยเกิร์ต", qty: "4 ถ้วย (หรือกระปุกใหญ่ 1 กก.)", price: 180, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 60, protein: 10, carb: 4, fat: 0.5 },
    storage: { zone: "fridge", note: "ชั้นบน/กลาง ปิดฝาสนิท ใช้ช้อนสะอาดตักทุกครั้ง", life: "เปิดแล้ว ~1 สัปดาห์ (ยึดวันหมดอายุข้างกระปุก)" } },
  { name: "นมจืด", unit: { grams: 250, label: "กล่อง" }, qty: "UHT จืด 1 ลิตร x2", price: 60, category: "โปรตีน", recurring: false, macrosPer100g: { kcal: 60, protein: 3.2, carb: 4.8, fat: 3.3 },
    storage: { zone: "pantry", note: "UHT ยังไม่เปิดวางนอกตู้ได้ · เปิดแล้วต้องแช่เย็นทันที", life: "เปิดแล้ว 3–4 วันในตู้เย็น" } },
  { name: "เวย์โปรตีน", unit: { grams: 30, label: "สกู๊ป" }, qty: "5 ปอนด์ (~2.27 กก. ≈ 75 สกู๊ป · สกู๊ปละ ~27฿)", price: 2000, category: "โปรตีน", recurring: true, macrosPer100g: { kcal: 400, protein: 83, carb: 8, fat: 5 },
    storage: { zone: "pantry", note: "ปิดฝาให้แน่น เก็บที่แห้ง อย่าแช่ตู้เย็น — ความชื้นทำผงจับก้อน", life: "หลายเดือน (ตามฉลาก)" } },

  // ── คาร์บ ──
  // ข้าวหอมมะลิขาว หุงสุก — USDA FDC #168878 (white rice, cooked): 130 kcal · P2.7 · C28.2 · F0.3 /100 ก.
  { name: "ข้าวหอมมะลิ", qty: "ข้าวหอมมะลิขาว 5 กก. (กรัมในเมนู = น้ำหนักหุงสุก)", price: 200, category: "คาร์บ", recurring: true, macrosPer100g: { kcal: 130, protein: 2.7, carb: 28.2, fat: 0.3 },
    storage: { zone: "pantry", note: "เทใส่โหล/กล่องปิดสนิทกันมอด · ข้าวหุงสุกแบ่งกล่องแช่เย็น กิน 3–4 วัน", life: "ข้าวสารหลายเดือน" } },
  { name: "ข้าวโอ๊ต", qty: "ควิกโอ๊ต 1 กก.", price: 150, category: "คาร์บ", recurring: true, macrosPer100g: { kcal: 380, protein: 13, carb: 67, fat: 7 },
    storage: { zone: "pantry", note: "ภาชนะปิดสนิท ที่แห้ง", life: "หลายเดือน" } },
  { name: "ขนมปังโฮลวีท", unit: { grams: 30, label: "แผ่น" }, qty: "โฮลวีท 1 แถว", price: 55, category: "คาร์บ", recurring: false, macrosPer100g: { kcal: 250, protein: 12, carb: 43, fat: 3.5 },
    storage: { zone: "pantry", note: "ที่จะกินใน 2–3 วันวางนอกตู้ · ที่เหลือแช่แข็ง หยิบทีละแผ่นเข้าไมโครเวฟได้เลย (อย่าแช่ช่องเย็นธรรมดา แข็งกระด้างเร็ว)", life: "นอกตู้ 2–3 วัน · ช่องแข็ง ~1 เดือน" } },

  // ── ผัก (ค่าโภชนาการดิบต่อ 100 ก. อ้างอิง USDA FoodData Central) ──
  // บรอกโคลี FDC #170379 · แครอท FDC #170393 · กะหล่ำปลี FDC #169975
  { name: "บรอกโคลี", qty: "แช่แข็งเอโร่ 1 กก. (หรือสด 2–3 หัว) — วิตามินซี/เค สูง", price: 90, category: "ผัก", recurring: false, macrosPer100g: { kcal: 31, protein: 2.6, carb: 6.3, fat: 0.3 },
    storage: { zone: "freezer", note: "แช่แข็ง: ตักใช้ทีละมื้อ เวฟจากแข็งได้เลย · สด: ลิ้นชักผัก ใช้ใน 3–5 วัน", life: "แช่แข็งหลายเดือน" } },
  { name: "แครอท", unit: { grams: 60, label: "หัว" }, qty: "สด ~1 กก. (5–6 หัวกลาง) — เบต้าแคโรทีน/วิตามินเอ", price: 35, category: "ผัก", recurring: false, macrosPer100g: { kcal: 41, protein: 0.9, carb: 9.6, fat: 0.2 },
    storage: { zone: "fridge", note: "ลิ้นชักผัก ไม่ต้องล้างก่อนเก็บ (ล้าง+ปอกตอนจะใช้)", life: "2–3 สัปดาห์" } },
  { name: "กะหล่ำปลี", qty: "หัวกลาง ~1 กก. — วิตามินซี/ไฟเบอร์ ราคาถูก", price: 30, category: "ผัก", recurring: false, macrosPer100g: { kcal: 25, protein: 1.3, carb: 5.8, fat: 0.1 },
    storage: { zone: "fridge", note: "ทั้งหัวใส่ลิ้นชักผัก · หั่นแล้วห่อฟิล์ม/ใส่กล่องปิด ใช้ใน 3–4 วัน", life: "ทั้งหัว 1–2 สัปดาห์" } },

  // ── ผลไม้ ──
  { name: "กล้วยหอม", unit: { grams: 100, label: "ลูก" }, qty: "1 หวี", price: 40, category: "ผลไม้", recurring: false, macrosPer100g: { kcal: 89, protein: 1.1, carb: 23, fat: 0.3 },
    storage: { zone: "pantry", note: "วางนอกตู้ที่อากาศถ่ายเท (แช่ตู้เปลือกดำเร็ว) · สุกงอมให้หั่นแว่นแช่แข็งไว้ทำไอศกรีมกล้วย", life: "2–5 วัน (เลือกเขียวอมเหลืองอยู่ครบสัปดาห์)" } },
  { name: "แอปเปิล", unit: { grams: 150, label: "ลูก" }, qty: "6 ลูก", price: 80, category: "ผลไม้", recurring: false, macrosPer100g: { kcal: 52, protein: 0.3, carb: 14, fat: 0.2 },
    storage: { zone: "fridge", note: "ลิ้นชักผัก/ผลไม้ — เย็นช่วยยืดอายุได้มาก", life: "หลายสัปดาห์" } },

  // ── ไขมันดี ──
  { name: "อัลมอนด์", unit: { grams: 28, label: "กำมือ" }, qty: "อัลมอนด์ดิบ 500 ก.", price: 200, category: "ไขมันดี", recurring: false, macrosPer100g: { kcal: 580, protein: 21, carb: 22, fat: 50 },
    storage: { zone: "pantry", note: "ภาชนะปิดสนิทที่เย็น · อากาศร้อน/ซื้อเยอะ ย้ายแช่ตู้กันหืนได้", life: "หลายเดือน" } },
  // วอลนัท — USDA FDC #170187: 654 kcal · P15.2 · C13.7 · F65.2 · ALA (โอเมกา-3 พืช) 9.08 ก. /100 ก.
  { name: "วอลนัท", qty: "วอลนัทซีก 500 ก. (ใช้ ~105 ก./สัปดาห์ ≈ ถุงละเดือน) — โอเมกา-3 สูงสุดในถั่ว", price: 280, category: "ไขมันดี", recurring: true, macrosPer100g: { kcal: 654, protein: 15.2, carb: 13.7, fat: 65.2 },
    storage: { zone: "pantry", note: "ปิดสนิทพ้นแดด · ไขมันสูงหืนง่าย ถ้ากินช้าย้ายแช่ตู้เย็น/ช่องแข็งยืดอายุ", life: "~1 เดือนนอกตู้ · แช่เย็นนานกว่า" } },
  { name: "เนยถั่ว", unit: { grams: 16, label: "ช้อนโต๊ะ" }, qty: "1 กระปุก (~500 ก.)", price: 120, category: "ไขมันดี", recurring: true, macrosPer100g: { kcal: 590, protein: 25, carb: 20, fat: 50 },
    storage: { zone: "pantry", note: "แบบทั่วไปวางนอกตู้ได้ · แบบธรรมชาติ (มีน้ำมันแยกชั้น) เปิดแล้วแช่ตู้กันหืน", life: "หลายเดือน (ตามฉลาก)" } },

  // ── ของหวาน/เบเกอรี่ ──
  { name: "ผงโกโก้", qty: "ผงโกโก้แท้ไม่ใส่น้ำตาล 1 กระปุก", price: 90, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 230, protein: 20, carb: 58, fat: 14 },
    storage: { zone: "pantry", note: "ปิดฝาสนิท ที่แห้งพ้นแดด", life: "หลายเดือน" } },
  { name: "อบเชย", qty: "อบเชยป่น 1 ขวดเล็ก", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 247, protein: 4, carb: 81, fat: 1 },
    storage: { zone: "pantry", note: "ปิดฝาสนิท ที่แห้ง", life: "หลายเดือน" } },
];

/** ของครัวพื้นฐานที่ต้องมีติดบ้านเสมอ (ใส่ในรายการซื้อของตลอด ไม่ขึ้นกับเมนู) */
export const pantryStaples: CatalogItem[] = [
  { name: "น้ำมันรำข้าว", unit: { grams: 5, label: "ช้อน" }, qty: "1 ลิตร (ทอด/ผัดได้ดี ราคาถูก)", price: 65, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 884, protein: 0, carb: 0, fat: 100 },
    storage: { zone: "pantry", note: "ที่มืดและเย็น ห่างเตา/แสงแดด ปิดฝาสนิท", life: "หลายเดือน" } },
  { name: "เกลือ", qty: "1 ถุง", price: 15, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    storage: { zone: "pantry", note: "ภาชนะแห้งปิดสนิท", life: "นานมาก" } },
  { name: "พริกไทยป่น", qty: "1 กระปุก", price: 30, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    storage: { zone: "pantry", note: "ปิดฝาสนิท ที่แห้ง", life: "หลายเดือน" } },
  { name: "ซีอิ๊วขาว", qty: "1 ขวด", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    storage: { zone: "pantry", note: "วางนอกตู้ได้ (แช่ตู้ช่วยคงคุณภาพขึ้นเล็กน้อย ไม่จำเป็น)", life: "นาน" } },
  { name: "น้ำปลา", qty: "1 ขวด", price: 35, category: "เครื่องปรุง", recurring: true, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    storage: { zone: "pantry", note: "วางนอกตู้ได้", life: "นาน" } },
  { name: "กระเทียมสับ", qty: "1 กระปุก/ถุง", price: 30, category: "เครื่องปรุง", recurring: false, macrosPer100g: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    storage: { zone: "fridge", note: "เปิดแล้วแช่ตู้ ปิดฝาสนิท", life: "ตามฉลาก" } },
];
