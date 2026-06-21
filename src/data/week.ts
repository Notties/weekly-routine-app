import type { Day } from "./types";

// ───────────────────────────────────────────────────────────
// แผน 7 วัน — แต่ละมื้อชี้ไปยัง "เมนูเริ่มต้น" ในคลัง (recipes.ts) ด้วย recipeId
// ผู้ใช้กดสลับเมนูในแอปได้ (จำรายวันรายมื้อ) วัตถุดิบจะคำนวณตามเมนูที่ใช้จริง
// แก้เมนูเริ่มต้น/เวลาได้ที่นี่ · แก้ตัวเมนู/วิธีทำที่ recipes.ts
// ───────────────────────────────────────────────────────────

export const week: Day[] = [
  // ───────────── จันทร์ — Full Body A ─────────────
  {
    key: "mon",
    label: "จันทร์",
    short: "จ",
    type: "weights",
    title: "Full Body A",
    workout: {
      time: { start: "19:00", end: "20:00" },
      warmup: [
        "ปั่นจักรยาน/เดินลู่เบา ๆ 5 นาที",
        "หมุนข้อไหล่–สะโพก–เข่า อย่างละ 10 ครั้ง",
        "Bodyweight squat 15 ครั้ง + Band pull-apart 15 ครั้ง",
      ],
      exercises: [
        { name: "Barbell Squat", muscle: "ขา/สะโพก", sets: 4, reps: "6–8", rest: "120 วิ" },
        { name: "Bench Press", muscle: "อก/ไหล่หน้า/ไทรเซ็ป", sets: 4, reps: "6–8", rest: "120 วิ" },
        { name: "Bent-over Row", muscle: "หลัง/ปีก", sets: 4, reps: "8–10", rest: "90 วิ" },
        { name: "Overhead Press", muscle: "ไหล่", sets: 3, reps: "8–10", rest: "90 วิ" },
        { name: "Plank", muscle: "แกนกลางลำตัว", sets: 3, reps: "45 วิ", rest: "45 วิ" },
      ],
      cooldown: ["ยืดต้นขาหน้า–อก–หลัง อย่างละ 30 วิ", "หายใจเข้าลึก–ออกยาว 1 นาที"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "17:30", slot: "preworkout", recipeId: "pw-banana" },
      { time: "20:30", slot: "postworkout", recipeId: "po-whey-rice" },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "วันเล่นหนัก พักให้เต็มที่ กล้ามซ่อมแซมตอนหลับลึก" },
  },

  // ───────────── อังคาร — คาร์ดิโอ (LISS) ─────────────
  {
    key: "tue",
    label: "อังคาร",
    short: "อ",
    type: "cardio",
    title: "คาร์ดิโอ (เผาไขมัน)",
    workout: {
      time: { start: "19:00", end: "19:45" },
      warmup: ["เดินเร็วอุ่นเครื่อง 5 นาที", "หมุนข้อเท้า–สะโพกเบา ๆ"],
      exercises: [
        { name: "เดินชันลู่วิ่ง (Incline)", muscle: "หัวใจ/ทั้งตัว", sets: 1, reps: "35 นาที โซน 2", rest: "-" },
        { name: "แพลงก์ + Side plank", muscle: "แกนกลางลำตัว", sets: 3, reps: "40 วิ", rest: "40 วิ" },
      ],
      cooldown: ["เดินช้าลง 5 นาที", "ยืดน่อง–ขาหลัง อย่างละ 30 วิ"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-bread" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "20:00", slot: "dinner", recipeId: "dn-chicken", tags: ["หลังเล่น = ซ่อมกล้าม"] },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "คาร์ดิโอเบา ฟื้นตัวเร็ว เข้านอนตรงเวลาเหมือนเดิม" },
  },

  // ───────────── พุธ — Full Body B ─────────────
  {
    key: "wed",
    label: "พุธ",
    short: "พ",
    type: "weights",
    title: "Full Body B",
    workout: {
      time: { start: "19:00", end: "20:00" },
      warmup: [
        "เดินลู่/ปั่นเบา ๆ 5 นาที",
        "Hip hinge เปล่า ๆ 15 ครั้ง + Scapular pull-up 10 ครั้ง",
        "Glute bridge 15 ครั้ง",
      ],
      exercises: [
        { name: "Deadlift", muscle: "หลังล่าง/สะโพก/ขาหลัง", sets: 4, reps: "5", rest: "150 วิ" },
        { name: "Incline Dumbbell Press", muscle: "อกบน/ไหล่", sets: 4, reps: "8–10", rest: "90 วิ" },
        { name: "Lat Pulldown / Pull-up", muscle: "ปีก/หลัง", sets: 4, reps: "8–12", rest: "90 วิ" },
        { name: "Walking Lunge", muscle: "ขา/ก้น", sets: 3, reps: "12 ก้าว/ข้าง", rest: "90 วิ" },
        { name: "Hanging Knee Raise", muscle: "หน้าท้องล่าง", sets: 3, reps: "12", rest: "60 วิ" },
      ],
      cooldown: ["ยืดสะโพก–ขาหลัง–ปีก อย่างละ 30 วิ", "เดินเบา ๆ ผ่อนคลาย 2 นาที"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "17:30", slot: "preworkout", recipeId: "pw-bread" },
      { time: "20:30", slot: "postworkout", recipeId: "po-whey-rice" },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "Deadlift หนัก หลังล่างต้องการพัก งดเล่นมือถือบนเตียง" },
  },

  // ───────────── พฤหัสบดี — คาร์ดิโอ (HIIT) ─────────────
  {
    key: "thu",
    label: "พฤหัสบดี",
    short: "พฤ",
    type: "cardio",
    title: "คาร์ดิโอ (HIIT)",
    workout: {
      time: { start: "19:00", end: "19:40" },
      warmup: ["เดิน/ปั่นเบา ๆ 5 นาที", "High knees + Butt kicks อย่างละ 30 วิ"],
      exercises: [
        { name: "HIIT จักรยาน/วิ่ง", muscle: "หัวใจ/ขา", sets: 10, reps: "เร็ว 20 วิ / ช้า 40 วิ", rest: "คาบในเซ็ต" },
        { name: "Mountain Climber", muscle: "แกนกลาง/ไหล่", sets: 3, reps: "30 วิ", rest: "30 วิ" },
        { name: "Cable/Floor Crunch", muscle: "หน้าท้อง", sets: 3, reps: "15", rest: "45 วิ" },
      ],
      cooldown: ["เดินช้า 5 นาที ให้ชีพจรลง", "ยืดทั้งตัวเบา ๆ"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-bread" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-milk-apple" },
      { time: "20:00", slot: "dinner", recipeId: "dn-chicken", tags: ["หลังเล่น = ซ่อมกล้าม"] },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "HIIT กระตุ้นระบบประสาท เลี่ยงคาเฟอีนหลัง 18:00 จะหลับง่ายขึ้น" },
  },

  // ───────────── ศุกร์ — Full Body C ─────────────
  {
    key: "fri",
    label: "ศุกร์",
    short: "ศ",
    type: "weights",
    title: "Full Body C",
    workout: {
      time: { start: "19:00", end: "20:00" },
      warmup: [
        "ปั่น/เดินลู่เบา ๆ 5 นาที",
        "RDL เปล่า ๆ 15 ครั้ง + Face pull เบา 15 ครั้ง",
        "Air squat 15 ครั้ง",
      ],
      exercises: [
        { name: "Romanian Deadlift", muscle: "ขาหลัง/ก้น", sets: 4, reps: "8", rest: "120 วิ" },
        { name: "Dumbbell Shoulder Press", muscle: "ไหล่", sets: 4, reps: "8–10", rest: "90 วิ" },
        { name: "Seated Cable Row", muscle: "หลังกลาง/ปีก", sets: 4, reps: "10", rest: "90 วิ" },
        { name: "Goblet Squat", muscle: "ขา/แกนกลาง", sets: 3, reps: "12", rest: "90 วิ" },
        { name: "Dumbbell Curl + Triceps Pushdown (ซูเปอร์เซ็ต)", muscle: "แขนหน้า/หลัง", sets: 3, reps: "12+12", rest: "60 วิ" },
      ],
      cooldown: ["ยืดไหล่–แขน–ขาหลัง อย่างละ 30 วิ", "หายใจผ่อนคลาย 1 นาที"],
    },
    meals: [
      { time: "07:00", slot: "breakfast", recipeId: "bf-oat" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "17:30", slot: "preworkout", recipeId: "pw-banana" },
      { time: "20:30", slot: "postworkout", recipeId: "po-whey-rice" },
    ],
    sleep: { bedtime: "23:30", wake: "07:00", hours: 7.5, note: "ปลายสัปดาห์ นอนเพิ่มได้นิดหน่อย แต่อย่าให้นาฬิกาชีวิตเพี้ยน" },
  },

  // ───────────── เสาร์ — วันพัก ─────────────
  {
    key: "sat",
    label: "เสาร์",
    short: "ส",
    type: "rest",
    title: "วันพัก",
    meals: [
      { time: "08:00", slot: "breakfast", recipeId: "bf-bread" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "18:30", slot: "dinner", recipeId: "dn-yogurt" },
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
      { time: "08:00", slot: "breakfast", recipeId: "bf-bread" },
      { time: "12:30", slot: "lunch", recipeId: "ln-chicken" },
      { time: "16:00", slot: "snack", recipeId: "sn-yogurt" },
      { time: "18:30", slot: "dinner", recipeId: "dn-yogurt" },
    ],
    sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "คืนก่อนเริ่มสัปดาห์ใหม่ นอนให้ตรงเวลา ตื่นสดชื่นพร้อมเล่น Full Body A" },
  },
];
