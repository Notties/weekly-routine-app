import type { Profile } from "./types";

// แก้ข้อมูลโปรไฟล์ได้ที่นี่
export const profile: Profile = {
  sex: "ชาย",
  age: 25,
  heightCm: 167,
  weightKg: 76.6, // InBody 24.08.2026
  goal: "ลดไขมัน 31% → ~18% แบบรักษากล้าม",
  workoutWindow: "19:00–20:00",
  bodyFatPct: 31, // InBody 24.08.2026 — อัปเดตทุกครั้งที่สแกนใหม่
};
