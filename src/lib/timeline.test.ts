import { describe, it, expect } from "bun:test";
import { toMinutes, buildTimeline } from "./timeline";
import type { Day } from "@/data/types";

const weightDay: Day = {
  key: "mon",
  label: "จันทร์",
  short: "จ",
  type: "weights",
  title: "Full Body A",
  workout: {
    time: { start: "19:00", end: "20:00" },
    warmup: ["x"],
    exercises: [
      { name: "Squat", muscle: "ขา", sets: 4, reps: "6-8", rest: "120 วิ" },
    ],
    cooldown: ["y"],
  },
  meals: [
    { time: "07:00", name: "เช้า", menu: "a", steps: ["1"], tags: [] },
    { time: "12:30", name: "กลางวัน", menu: "b", steps: ["1"], tags: [] },
    {
      time: "20:30",
      name: "หลังเล่น",
      menu: "c",
      steps: ["1"],
      tags: ["หลังเล่น = ซ่อมกล้าม"],
    },
  ],
  sleep: { bedtime: "23:00", wake: "06:30", hours: 7.5, note: "n" },
};

const restDay: Day = {
  ...weightDay,
  type: "rest",
  title: "วันพัก",
  workout: undefined,
};

describe("toMinutes", () => {
  it("แปลง HH:MM เป็นจำนวนนาที", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("06:30")).toBe(390);
    expect(toMinutes("23:00")).toBe(1380);
  });
});

describe("buildTimeline", () => {
  it("entry แรกคือ 'ตื่น' และ entry สุดท้ายคือ 'เข้านอน'", () => {
    const t = buildTimeline(weightDay);
    expect(t[0].kind).toBe("wake");
    expect(t[t.length - 1].kind).toBe("bedtime");
  });

  it("ทุก entry เรียงตามเวลาจากน้อยไปมาก", () => {
    const t = buildTimeline(weightDay);
    const mins = t.map((e) => e.minutes);
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
  });

  it("วันเวตมีบล็อก workout และอยู่ก่อนมื้อหลังเล่น", () => {
    const t = buildTimeline(weightDay);
    const wi = t.findIndex((e) => e.kind === "workout");
    const mi = t.findIndex((e) => e.meal?.name === "หลังเล่น");
    expect(wi).toBeGreaterThan(-1);
    expect(mi).toBeGreaterThan(-1);
    expect(wi).toBeLessThan(mi);
  });

  it("บล็อก workout พกข้อมูล workout มาด้วย", () => {
    const t = buildTimeline(weightDay);
    const w = t.find((e) => e.kind === "workout");
    expect(w?.workout?.exercises.length).toBe(1);
  });

  it("วันพักไม่มีบล็อก workout", () => {
    const t = buildTimeline(restDay);
    expect(t.some((e) => e.kind === "workout")).toBe(false);
  });

  it("มี winddown (ผ่อนคลายก่อนนอน) อยู่ก่อน bedtime", () => {
    const t = buildTimeline(weightDay);
    const wd = t.findIndex((e) => e.kind === "winddown");
    const bt = t.findIndex((e) => e.kind === "bedtime");
    expect(wd).toBeGreaterThan(-1);
    expect(wd).toBeLessThan(bt);
  });

  it("มื้ออาหารทุกมื้อปรากฏในไทม์ไลน์พร้อม steps", () => {
    const t = buildTimeline(weightDay);
    const meals = t.filter((e) => e.kind === "meal");
    expect(meals.length).toBe(3);
    expect(meals.every((m) => (m.meal?.steps.length ?? 0) > 0)).toBe(true);
  });
});
