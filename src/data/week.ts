import type { Day } from "./types";

// ───────────────────────────────────────────────────────────
// แผน 7 วัน — แต่ละมื้อชี้ไปยัง "เมนูเริ่มต้น" ในคลัง (recipes.ts) ด้วย recipeId
// ผู้ใช้กดสลับเมนูในแอปได้ (จำรายวันรายมื้อ) วัตถุดิบจะคำนวณตามเมนูที่ใช้จริง
// แก้เมนูเริ่มต้น/เวลาได้ที่นี่ · แก้ตัวเมนู/วิธีทำที่ recipes.ts
// ───────────────────────────────────────────────────────────

export const week: Day[] = [
  // ───────────── จันทร์ — Push (ดัน) ─────────────
  {
    key: "mon",
    label: "จันทร์",
    short: "จ",
    type: "weights",
    title: "Push · อก/ไหล่/ไทรเซ็ป",
    workout: {
      time: { start: "19:00", end: "20:00" },
      warmup: [
        "ปั่นจักรยาน/เดินลู่เบา ๆ 5 นาที",
        "หมุนข้อไหล่ + Band pull-apart 15 ครั้ง",
        "ดันบาร์เปล่า/วิดพื้น 15 ครั้ง อุ่นข้อไหล่–ศอก",
      ],
      exercises: [
        { name: "Bench Press", muscle: "อก/ไหล่หน้า/ไทรเซ็ป", sets: 4, reps: "6–8", rest: "120 วิ" },
        { name: "Overhead Press", muscle: "ไหล่", sets: 4, reps: "8–10", rest: "90 วิ" },
        { name: "Incline Dumbbell Press", muscle: "อกบน/ไหล่", sets: 3, reps: "8–10", rest: "90 วิ" },
        { name: "Lateral Raise", muscle: "ไหล่ข้าง", sets: 3, reps: "12–15", rest: "60 วิ" },
        { name: "Triceps Pushdown", muscle: "ไทรเซ็ป", sets: 3, reps: "12–15", rest: "60 วิ" },
        { name: "Plank", muscle: "แกนกลางลำตัว", sets: 3, reps: "45 วิ", rest: "45 วิ" },
        { name: "Side Plank", muscle: "หน้าท้องด้านข้าง", sets: 3, reps: "30 วิ/ข้าง", rest: "30 วิ" },
      ],
      cooldown: ["ยืดอก–ไหล่หน้า–ไทรเซ็ป อย่างละ 30 วิ", "หายใจเข้าลึก–ออกยาว 1 นาที"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "17:30", slot: "preworkout", recipeId: "pw-banana" },
      { time: "20:30", slot: "postworkout", recipeId: "po-chicken" },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "วันดัน (อก/ไหล่) พักให้เต็มที่ กล้ามซ่อมแซมตอนหลับลึก" },
  },

  // ───────────── อังคาร — วันพัก (คาร์ดิโอเบา optional) ─────────────
  {
    key: "tue",
    label: "อังคาร",
    short: "อ",
    type: "rest",
    title: "คาร์ดิโอเบา (optional)",
    workout: {
      time: { start: "19:00", end: "19:30" },
      warmup: ["เดินเร็วอุ่นเครื่อง 5 นาที", "หมุนข้อเท้า–สะโพกเบา ๆ"],
      exercises: [
        { name: "เดินชันลู่วิ่ง (Incline) / ปั่นจักรยาน", muscle: "หัวใจ/ทั้งตัว", sets: 1, reps: "25–30 นาที โซน 2", rest: "-" },
      ],
      cooldown: ["เดินช้าลง 5 นาที", "ยืดน่อง–ขาหลัง อย่างละ 30 วิ"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-yogurt-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "20:00", slot: "dinner", recipeId: "dn-chicken" },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "พักฟื้นจากวันดัน เดินเล่น/ยืดเหยียดเบา ๆ ได้ (อยากเผาไขมันเพิ่มเดิน Zone 2 ~30 นาทีก็ได้)" },
  },

  // ───────────── พุธ — Pull (ดึง) ─────────────
  {
    key: "wed",
    label: "พุธ",
    short: "พ",
    type: "weights",
    title: "Pull · หลัง/ปีก/ไบเซ็ป",
    workout: {
      time: { start: "19:00", end: "20:00" },
      warmup: [
        "เดินลู่/ปั่นเบา ๆ 5 นาที",
        "Scapular pull-up 10 ครั้ง + Band pull-apart 15 ครั้ง",
        "Hip hinge เปล่า ๆ 15 ครั้ง อุ่นหลังล่างก่อน Deadlift",
      ],
      exercises: [
        { name: "Deadlift", muscle: "หลังล่าง/สะโพก/ขาหลัง", sets: 3, reps: "5", rest: "150 วิ" },
        { name: "Lat Pulldown / Pull-up", muscle: "ปีก/หลัง", sets: 4, reps: "8–12", rest: "90 วิ" },
        { name: "Seated Cable Row", muscle: "หลังกลาง/ปีก", sets: 4, reps: "10", rest: "90 วิ" },
        { name: "Face Pull", muscle: "ไหล่หลัง/หลังบน", sets: 3, reps: "15", rest: "60 วิ" },
        { name: "Dumbbell Curl", muscle: "แขนหน้า (ไบเซ็ป)", sets: 3, reps: "12", rest: "60 วิ" },
        { name: "Hanging Knee Raise", muscle: "หน้าท้องล่าง", sets: 3, reps: "12", rest: "60 วิ" },
      ],
      cooldown: ["ยืดปีก–หลัง–ไบเซ็ป อย่างละ 30 วิ", "ห้อยบาร์ผ่อนหลัง 30 วิ"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "17:30", slot: "preworkout", recipeId: "pw-bread" },
      { time: "20:30", slot: "postworkout", recipeId: "po-chicken" },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "Deadlift หนัก หลังล่างต้องการพัก งดเล่นมือถือบนเตียง" },
  },

  // ───────────── พฤหัสบดี — วันพัก (คาร์ดิโอเบา optional) ─────────────
  {
    key: "thu",
    label: "พฤหัสบดี",
    short: "พฤ",
    type: "rest",
    title: "คาร์ดิโอเบา (optional)",
    workout: {
      time: { start: "19:00", end: "19:30" },
      warmup: ["เดิน/ปั่นเบา ๆ อุ่นเครื่อง 5 นาที"],
      exercises: [
        { name: "เดินเร็ว / ปั่นจักรยาน / ว่ายน้ำ", muscle: "หัวใจ/ทั้งตัว", sets: 1, reps: "25–30 นาที โซน 2", rest: "-" },
      ],
      cooldown: ["เดินช้าลง 5 นาที", "ยืดทั้งตัวเบา ๆ"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-yogurt-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "20:00", slot: "dinner", recipeId: "dn-chicken" },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "พักก่อนวันขา ฟื้นให้เต็มที่ นอนให้ครบ ตื่นมาขาพร้อมลุย" },
  },

  // ───────────── ศุกร์ — Legs (ขา) ─────────────
  {
    key: "fri",
    label: "ศุกร์",
    short: "ศ",
    type: "weights",
    title: "Legs · ขา/ก้น/น่อง",
    workout: {
      time: { start: "19:00", end: "20:00" },
      warmup: [
        "ปั่น/เดินลู่เบา ๆ 5 นาที",
        "Air squat 15 ครั้ง + Glute bridge 15 ครั้ง",
        "RDL เปล่า ๆ 15 ครั้ง อุ่นสะโพก–ขาหลัง",
      ],
      exercises: [
        { name: "Barbell Squat", muscle: "ขา/สะโพก", sets: 4, reps: "6–8", rest: "120 วิ" },
        { name: "Romanian Deadlift", muscle: "ขาหลัง/ก้น", sets: 3, reps: "8", rest: "120 วิ" },
        { name: "Lying Leg Curl", muscle: "ขาหลัง (งอเข่า)", sets: 3, reps: "10–12", rest: "90 วิ" },
        { name: "Walking Lunge", muscle: "ขา/ก้น", sets: 3, reps: "12 ก้าว/ข้าง", rest: "90 วิ" },
        { name: "Goblet Squat", muscle: "ขา/แกนกลาง", sets: 3, reps: "12", rest: "90 วิ" },
        { name: "Standing Calf Raise", muscle: "น่อง", sets: 4, reps: "12–15", rest: "60 วิ" },
      ],
      cooldown: ["ยืดต้นขาหน้า–ขาหลัง–น่อง อย่างละ 30 วิ", "เดินเบา ๆ ผ่อนคลาย 2 นาที"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "17:30", slot: "preworkout", recipeId: "pw-banana" },
      { time: "20:30", slot: "postworkout", recipeId: "po-chicken" },
    ],
    sleep: { bedtime: "23:30", wake: "07:00", hours: 7.5, note: "วันขาหนักสุดของสัปดาห์ ขา/ก้นล้าได้มาก พักให้เต็มที่ ดื่มน้ำเยอะ ๆ" },
  },

  // ───────────── เสาร์ — วันพัก ─────────────
  {
    key: "sat",
    label: "เสาร์",
    short: "ส",
    type: "rest",
    title: "วันพัก",
    meals: [
      { time: "08:00", slot: "breakfast", recipeId: "bf-yogurt-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "18:30", slot: "dinner", recipeId: "dn-chicken" },
    ],
    sleep: { bedtime: "23:30", wake: "07:30", hours: 8, note: "วันพักจริง เดินเล่น/ยืดเหยียดเบา ๆ ได้ ฟื้นกล้ามให้พร้อมสัปดาห์หน้า" },
  },

  // ───────────── อาทิตย์ — วันพัก ─────────────
  {
    key: "sun",
    label: "อาทิตย์",
    short: "อา",
    type: "rest",
    title: "วันพัก",
    meals: [
      { time: "08:00", slot: "breakfast", recipeId: "bf-yogurt-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "18:30", slot: "dinner", recipeId: "dn-chicken" },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "คืนก่อนเริ่มสัปดาห์ใหม่ นอนให้ตรงเวลา ตื่นสดชื่นพร้อมเล่นวัน Push" },
  },
];
