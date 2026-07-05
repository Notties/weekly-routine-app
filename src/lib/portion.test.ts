import { describe, it, expect } from "bun:test";
import { portionLabel } from "./portion";

describe("portionLabel — แปลงกรัมเป็นหน่วยบ้าน ๆ", () => {
  it("ไข่ 150 ก. → 3 ฟอง", () => {
    expect(portionLabel("ไข่ไก่", 150)).toBe("3 ฟอง (150 ก.)");
  });

  it("กล้วย 120 ก. → 1.2 ลูก (ทศนิยม 1 ตำแหน่ง)", () => {
    expect(portionLabel("กล้วยหอม", 120)).toBe("1.2 ลูก (120 ก.)");
  });

  it("เวย์ 30 ก. → 1 สกู๊ป · เนยถั่ว 16 ก. → 1 ช้อนโต๊ะ", () => {
    expect(portionLabel("เวย์โปรตีน", 30)).toBe("1 สกู๊ป (30 ก.)");
    expect(portionLabel("เนยถั่ว", 16)).toBe("1 ช้อนโต๊ะ (16 ก.)");
  });

  it("ของที่ต้องชั่ง (ไม่มีหน่วยนับ) → กรัมล้วน", () => {
    expect(portionLabel("ข้าวกล้อง", 220)).toBe("220 ก.");
    expect(portionLabel("อกไก่", 200)).toBe("200 ก.");
  });

  it("ต่ำกว่าครึ่งหน่วย → กรัมล้วน (นม 30 ก. ไม่ใช่ 0.1 กล่อง)", () => {
    expect(portionLabel("นมจืด", 30)).toBe("30 ก.");
  });

  it("ชื่อที่ไม่รู้จัก → กรัมล้วน ไม่พัง", () => {
    expect(portionLabel("ไม่มีจริง", 99)).toBe("99 ก.");
  });
});
