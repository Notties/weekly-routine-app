import type { Day, Meal } from "./types";

// ───────────────────────────────────────────────────────────
// แผน 7 วัน (จันทร์–อาทิตย์)
//
// 🍳 เมนูสำหรับ "มือใหม่" ใช้แค่ 4 อุปกรณ์: กระทะไฟฟ้า · ไมโครเวฟ ·
//    เครื่องต้มไข่ · หม้อหุงข้าว — เป็นเมนูแกนไม่กี่อย่างวนทั้งสัปดาห์
//    (แก้เมนูแกนข้างล่างที่เดียว เปลี่ยนทั้งสัปดาห์)
// ───────────────────────────────────────────────────────────

// ── เมนูแกน (ใช้ซ้ำหลายวัน) ──
const breakfastOat: Meal = {
  time: "07:00",
  name: "มื้อเช้า",
  menu: "ข้าวโอ๊ตไมโครเวฟ + ไข่ต้ม 2 ฟอง + กล้วย",
  equipment: ["เครื่องต้มไข่", "ไมโครเวฟ"],
  steps: [
    "ใส่ไข่ 2 ฟองในเครื่องต้มไข่ เติมน้ำตามขีด “สุกแข็ง” กดปุ่ม รอจนเครื่องดับเอง",
    "ใส่ข้าวโอ๊ต 1/2 ถ้วย + นมจืด/น้ำ 1 ถ้วย ในชามทนไมโครเวฟ อุ่น 2 นาที แล้วคนให้เข้ากัน (ระวังร้อน)",
    "ปอกไข่ กินคู่ข้าวโอ๊ตและกล้วย",
  ],
  tags: ["โปรตีนสูง"],
};

const breakfastBread: Meal = {
  time: "07:00",
  name: "มื้อเช้า",
  menu: "ขนมปังโฮลวีท 2 แผ่น + ไข่ต้ม 2 ฟอง + กล้วย",
  equipment: ["เครื่องต้มไข่", "ไมโครเวฟ"],
  steps: [
    "ต้มไข่ 2 ฟองในเครื่องต้มไข่ (ขีด “สุกแข็ง”) รอจนเครื่องดับ",
    "วางขนมปัง 2 แผ่นในจาน อุ่นไมโครเวฟ 15 วินาที (หรือกินสด) ทาเนยถั่วบาง ๆ",
    "ปอกไข่ กินคู่ขนมปังและกล้วย",
  ],
  tags: ["โปรตีนสูง"],
};

const chickenRice: Meal = {
  time: "12:30",
  name: "มื้อกลางวัน",
  menu: "ข้าวกล้อง + อกไก่ทอดกระทะ + ผัก (สลับเป็นหมูสันในได้ วิธีเดียวกัน)",
  equipment: ["หม้อหุงข้าว", "กระทะไฟฟ้า", "ไมโครเวฟ"],
  steps: [
    "ข้าว: หุงข้าวกล้อง (หม้อหุงข้าว) ตักกินมื้อนี้ ที่เหลือแบ่งใส่กล่องไว้กินมื้อต่อไปของวันนี้",
    "อกไก่: หั่นชิ้นบาง โรยเกลือ+พริกไทย → กระทะไฟฟ้าไฟกลาง น้ำมัน 1 ช้อน → ทอด 4–5 นาที/ด้าน จนข้างในไม่มีสีชมพู (ทอดเผื่อมื้อหลังเล่น แล้วแบ่งใส่กล่อง)",
    "ผัก: ใส่ผัก+น้ำนิดหน่อยในชาม อุ่นไมโครเวฟ 2 นาที (หรือต้มในกระทะ 3 นาที)",
  ],
  tags: [],
};

const preWorkout: Meal = {
  time: "17:30",
  name: "ก่อนเล่น",
  menu: "กล้วย 1 ลูก + กาแฟดำ",
  equipment: ["ไม่ต้องปรุง"],
  steps: [
    "กินกล้วยก่อนเล่น ~1.5 ชม. ให้มีแรง",
    "ชงกาแฟดำ (ไม่ใส่น้ำตาล) ถ้าอยากได้แรงเพิ่ม",
  ],
  tags: ["ก่อนเล่น"],
};

const postWorkoutWeights: Meal = {
  time: "20:30",
  name: "หลังเล่น",
  menu: "เวย์โปรตีน + ข้าวกล้อง + อกไก่ + ผัก",
  equipment: ["ไมโครเวฟ", "กระทะไฟฟ้า"],
  steps: [
    "ดื่มเวย์ 1 สกู๊ปผสมน้ำเปล่าทันทีหลังเล่น",
    "อุ่นข้าว+อกไก่กล่องที่ทำไว้ตอนกลางวัน ไมโครเวฟ 2 นาที (หรือทอดอกไก่สดในกระทะ 4–5 นาที/ด้าน)",
    "อุ่นผักไมโครเวฟ 2 นาที กินให้ครบภายใน 1 ชม. หลังเล่น",
  ],
  tags: ["หลังเล่น = ซ่อมกล้าม"],
};

const snackYogurt: Meal = {
  time: "16:00",
  name: "ของว่าง",
  menu: "กรีกโยเกิร์ต + อัลมอนด์ 1 กำมือ",
  equipment: ["ไม่ต้องปรุง"],
  steps: [
    "ตักกรีกโยเกิร์ตใส่ถ้วย โรยอัลมอนด์",
    "กินก่อนคาร์ดิโอให้มีแรง",
  ],
  tags: ["ก่อนเล่น"],
};

const postCardio: Meal = {
  time: "20:00",
  name: "มื้อเย็น",
  menu: "เวย์โปรตีน + อกไก่ทอดกระทะ + ผัก",
  equipment: ["กระทะไฟฟ้า", "ไมโครเวฟ"],
  steps: [
    "ดื่มเวย์ 1 สกู๊ปหลังคาร์ดิโอ",
    "อุ่นอกไก่กล่องที่ทำไว้ตอนกลางวัน ไมโครเวฟ 2 นาที (หรือทอดสดในกระทะ 4–5 นาที/ด้าน)",
    "อุ่นผักไมโครเวฟ 2 นาที",
  ],
  tags: ["หลังเล่น = ซ่อมกล้าม"],
};

const yogurtDinner: Meal = {
  time: "18:30",
  name: "มื้อเย็น",
  menu: "กรีกโยเกิร์ต + ผลไม้ + ไข่ต้ม 2 ฟอง",
  equipment: ["เครื่องต้มไข่", "ไม่ต้องปรุง"],
  steps: [
    "ต้มไข่ 2 ฟองในเครื่องต้มไข่",
    "ตักกรีกโยเกิร์ตใส่ถ้วย ใส่ผลไม้หั่นชิ้น (กล้วย/แอปเปิล)",
    "กินคู่ไข่ต้ม เบาท้องก่อนนอน",
  ],
  tags: [],
};

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
      cooldown: [
        "ยืดต้นขาหน้า–อก–หลัง อย่างละ 30 วิ",
        "หายใจเข้าลึก–ออกยาว 1 นาที",
      ],
    },
    meals: [breakfastOat, chickenRice, preWorkout, postWorkoutWeights],
    sleep: {
      bedtime: "23:00",
      wake: "06:30",
      hours: 7.5,
      note: "วันเล่นหนัก พักให้เต็มที่ กล้ามซ่อมแซมตอนหลับลึก",
    },
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
    meals: [breakfastBread, chickenRice, snackYogurt, postCardio],
    sleep: {
      bedtime: "23:00",
      wake: "06:30",
      hours: 7.5,
      note: "คาร์ดิโอเบา ฟื้นตัวเร็ว เข้านอนตรงเวลาเหมือนเดิม",
    },
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
    meals: [breakfastOat, chickenRice, preWorkout, postWorkoutWeights],
    sleep: {
      bedtime: "23:00",
      wake: "06:30",
      hours: 7.5,
      note: "Deadlift หนัก หลังล่างต้องการพัก งดเล่นมือถือบนเตียง",
    },
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
    meals: [breakfastBread, chickenRice, snackYogurt, postCardio],
    sleep: {
      bedtime: "23:00",
      wake: "06:30",
      hours: 7.5,
      note: "HIIT กระตุ้นระบบประสาท เลี่ยงคาเฟอีนหลัง 18:00 จะหลับง่ายขึ้น",
    },
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
    meals: [breakfastOat, chickenRice, preWorkout, postWorkoutWeights],
    sleep: {
      bedtime: "23:30",
      wake: "07:00",
      hours: 7.5,
      note: "ปลายสัปดาห์ นอนเพิ่มได้นิดหน่อย แต่อย่าให้นาฬิกาชีวิตเพี้ยน",
    },
  },

  // ───────────── เสาร์ — วันพัก ─────────────
  {
    key: "sat",
    label: "เสาร์",
    short: "ส",
    type: "rest",
    title: "วันพัก",
    meals: [
      { ...breakfastBread, time: "08:00" },
      chickenRice,
      yogurtDinner,
    ],
    sleep: {
      bedtime: "23:30",
      wake: "07:30",
      hours: 8,
      note: "วันพักจริง เดินเล่น/ยืดเหยียดเบา ๆ ได้ ฟื้นกล้ามให้พร้อมสัปดาห์หน้า",
    },
  },

  // ───────────── อาทิตย์ — วันพัก ─────────────
  {
    key: "sun",
    label: "อาทิตย์",
    short: "อา",
    type: "rest",
    title: "วันพัก",
    meals: [
      { ...breakfastOat, time: "08:00" },
      chickenRice,
      yogurtDinner,
    ],
    sleep: {
      bedtime: "23:00",
      wake: "06:30",
      hours: 7.5,
      note: "คืนก่อนเริ่มสัปดาห์ใหม่ นอนให้ตรงเวลา ตื่นสดชื่นพร้อมเล่น Full Body A",
    },
  },
];
